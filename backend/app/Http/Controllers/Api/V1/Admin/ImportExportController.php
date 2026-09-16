<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessImportJob;
use App\Models\Import;
use App\Services\ImportExport\ExportProcessor;
use App\Services\ImportExport\ExportRegistry;
use App\Services\ImportExport\FileParser;
use App\Services\ImportExport\ImportProcessor;
use App\Services\ImportExport\ImportRegistry;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImportExportController extends Controller
{
    use ApiResponse;

    /**
     * List all registered importers.
     */
    public function getImporters(): JsonResponse
    {
        return $this->successResponse(
            array_values(ImportRegistry::all()),
            'Available importers retrieved successfully.'
        );
    }

    /**
     * List all registered exporters.
     */
    public function getExporters(): JsonResponse
    {
        $exporters = array_values(ExportRegistry::all());
        // Clean out raw query closures for JSON response
        $clean = array_map(function ($exp) {
            unset($exp['query']);
            return $exp;
        }, $exporters);

        return $this->successResponse($clean, 'Available exporters retrieved successfully.');
    }

    /**
     * Step 1 & 2: Upload file, detect headers and create Import record.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'importable_type' => ['required', 'string'],
            'file' => ['required', 'file', 'max:20480'], // max 20MB
        ]);

        $type = $request->input('importable_type');
        $definition = ImportRegistry::get($type);

        if (!$definition) {
            return $this->errorResponse("Unsupported import type: {$type}", 400);
        }

        // Authorize
        if (!empty($definition['permission']) && !$request->user()->can($definition['permission']) && !$request->user()->hasRole('Super Admin')) {
            return $this->errorResponse('Unauthorized to import this resource.', 403);
        }

        $file = $request->file('file');
        $originalFilename = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension());

        if (!in_array($extension, ['csv', 'txt', 'xlsx'])) {
            return $this->errorResponse('Invalid file format. Only CSV and XLSX are supported.', 422);
        }

        $storedPath = $file->store('imports', 'local');
        $fullPath = Storage::disk('local')->path($storedPath);

        try {
            $headers = FileParser::readHeaders($fullPath, $extension);
            $preview = FileParser::readPreview($fullPath, $extension, 5);
            $totalRows = FileParser::countRows($fullPath, $extension);
        } catch (Exception $e) {
            Storage::disk('local')->delete($storedPath);
            return $this->errorResponse("Could not parse file: {$e->getMessage()}", 422);
        }

        $import = Import::create([
            'user_id' => $request->user()->id,
            'importable_type' => $type,
            'original_filename' => $originalFilename,
            'stored_path' => $storedPath,
            'file_format' => $extension === 'xlsx' ? 'xlsx' : 'csv',
            'status' => 'uploaded',
            'total_rows' => $totalRows,
        ]);

        // Auto-match headers with definition field aliases
        $suggestedMapping = [];
        foreach ($headers as $header) {
            $matchedField = null;
            $normalizedHeader = strtolower(str_replace([' ', '_', '-'], '', $header));

            foreach ($definition['fields'] as $field) {
                $aliases = array_map(fn($a) => strtolower(str_replace([' ', '_', '-'], '', $a)), $field['aliases'] ?? [$field['name']]);
                if (in_array($normalizedHeader, $aliases) || $normalizedHeader === strtolower($field['name'])) {
                    $matchedField = $field['name'];
                    break;
                }
            }

            $suggestedMapping[$header] = $matchedField ?? '__ignore__';
        }

        return $this->successResponse([
            'import' => $import,
            'headers' => $headers,
            'suggested_mapping' => $suggestedMapping,
            'available_fields' => $definition['fields'],
            'sample_rows' => $preview['rows'],
            'total_rows' => $totalRows,
        ], 'File uploaded and parsed successfully.');
    }

    /**
     * Step 3 & 4: Preview validation with mapped columns.
     */
    public function previewMapping(Request $request, string $uuid): JsonResponse
    {
        $import = Import::where('uuid', $uuid)->firstOrFail();

        $request->validate([
            'column_mapping' => ['required', 'array'],
        ]);

        $columnMapping = $request->input('column_mapping');

        try {
            $previewResult = ImportProcessor::preview($import, $columnMapping);
            $import->update([
                'column_mapping' => $columnMapping,
                'status' => 'mapping',
            ]);

            return $this->successResponse($previewResult, 'Mapping preview generated successfully.');
        } catch (Exception $e) {
            return $this->errorResponse("Validation preview error: {$e->getMessage()}", 422);
        }
    }

    /**
     * Step 5 & 6: Confirm and trigger processing.
     */
    public function process(Request $request, string $uuid): JsonResponse
    {
        $import = Import::where('uuid', $uuid)->firstOrFail();

        $request->validate([
            'column_mapping' => ['required', 'array'],
            'options' => ['nullable', 'array'],
        ]);

        $import->update([
            'column_mapping' => $request->input('column_mapping'),
            'options' => $request->input('options', []),
            'status' => 'processing',
        ]);

        // If row count is small (<100), process inline; otherwise queue
        if ($import->total_rows <= 100) {
            ImportProcessor::process($import);
            $import->refresh();
        } else {
            ProcessImportJob::dispatch($import);
        }

        return $this->successResponse($import, 'Import processing started.');
    }

    /**
     * Step 7: Get progress and results.
     */
    public function progress(string $uuid): JsonResponse
    {
        $import = Import::where('uuid', $uuid)->firstOrFail();
        return $this->successResponse($import, 'Import status retrieved.');
    }

    /**
     * List past import records.
     */
    public function history(Request $request): JsonResponse
    {
        $imports = Import::with('user:id,name,email')
            ->latest()
            ->paginate($request->input('per_page', 15));

        return $this->paginatedResponse($imports, 'Import history retrieved.');
    }

    /**
     * Download failed rows report.
     */
    public function downloadErrors(string $uuid): StreamedResponse|JsonResponse
    {
        $import = Import::where('uuid', $uuid)->firstOrFail();
        $errors = $import->errors_summary ?? [];

        if (empty($errors)) {
            return $this->errorResponse('No failure records available for this import.', 404);
        }

        $filename = 'import_failures_' . $import->uuid . '.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return response()->stream(function () use ($errors) {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Row Number', 'Errors', 'Sample Data']);

            foreach ($errors as $item) {
                fputcsv($handle, [
                    $item['row'] ?? '-',
                    is_array($item['errors'] ?? null) ? implode('; ', $item['errors']) : ($item['errors'] ?? ''),
                    json_encode($item['data'] ?? []),
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Generic Streamed Export.
     */
    public function export(Request $request, string $key): StreamedResponse|JsonResponse
    {
        $definition = ExportRegistry::get($key);
        if (!$definition) {
            return $this->errorResponse("Unknown export type: {$key}", 404);
        }

        if (!empty($definition['permission']) && !$request->user()->can($definition['permission']) && !$request->user()->hasRole('Super Admin')) {
            return $this->errorResponse('Unauthorized to export this resource.', 403);
        }

        $options = [
            'selected_ids' => $request->input('selected_ids'),
            'search' => $request->input('search'),
            'sort_by' => $request->input('sort_by'),
            'sort_direction' => $request->input('sort_direction'),
            'filename' => $request->input('filename', $key . '_export_' . date('Y_m_d_His')),
        ];

        return ExportProcessor::streamCsv($key, $options);
    }
}
