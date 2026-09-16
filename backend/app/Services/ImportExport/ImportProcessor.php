<?php

namespace App\Services\ImportExport;

use App\Models\Import;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ImportProcessor
{
    /**
     * Preview mapped data and validate sample rows.
     */
    public static function preview(Import $import, array $columnMapping): array
    {
        $definition = ImportRegistry::get($import->importable_type);
        if (!$definition) {
            throw new Exception("Unknown import type: {$import->importable_type}");
        }

        $filePath = Storage::disk('local')->path($import->stored_path);
        $previewData = FileParser::readPreview($filePath, $import->file_format, 5);

        $mappedRows = [];
        $validationErrors = [];

        foreach ($previewData['rows'] as $index => $rawRow) {
            $mappedRow = self::transformRow($rawRow, $columnMapping);
            $mappedRows[] = $mappedRow;

            // Validate against definition rules
            $rules = [];
            foreach ($definition['fields'] as $field) {
                if (isset($field['validation'])) {
                    $rules[$field['name']] = $field['validation'];
                }
            }

            if (!empty($rules)) {
                $validator = Validator::make($mappedRow, $rules);
                if ($validator->fails()) {
                    $validationErrors[$index] = $validator->errors()->toArray();
                }
            }
        }

        return [
            'headers' => $previewData['headers'],
            'mapped_rows' => $mappedRows,
            'errors' => $validationErrors,
            'total_rows_estimate' => FileParser::countRows($filePath, $import->file_format),
        ];
    }

    /**
     * Execute full import processing.
     */
    public static function process(Import $import): void
    {
        $definition = ImportRegistry::get($import->importable_type);
        if (!$definition) {
            $import->update([
                'status' => 'failed',
                'errors_summary' => ['error' => "Unknown import type: {$import->importable_type}"],
            ]);
            return;
        }

        $import->update([
            'status' => 'processing',
            'started_at' => now(),
        ]);

        $filePath = Storage::disk('local')->path($import->stored_path);
        if (!file_exists($filePath)) {
            $import->update([
                'status' => 'failed',
                'errors_summary' => ['error' => 'Import file not found on disk.'],
            ]);
            return;
        }

        $columnMapping = $import->column_mapping ?? [];
        $options = $import->options ?? [];
        $duplicateStrategy = $options['duplicate_strategy'] ?? ($definition['duplicate_strategy'] ?? 'skip');

        $rules = [];
        foreach ($definition['fields'] as $field) {
            if (isset($field['validation'])) {
                $rules[$field['name']] = $field['validation'];
            }
        }

        $processor = $definition['processor'];
        $processed = 0;
        $successful = 0;
        $failed = 0;
        $skipped = 0;
        $failures = [];

        try {
            foreach (FileParser::readRows($filePath, $import->file_format) as $rowIndex => $rawRow) {
                $processed++;
                $mappedRow = self::transformRow($rawRow, $columnMapping);

                if (!empty($rules)) {
                    $validator = Validator::make($mappedRow, $rules);
                    if ($validator->fails()) {
                        $failed++;
                        if (count($failures) < 500) {
                            $failures[] = [
                                'row' => $rowIndex + 2, // 1-indexed plus header
                                'errors' => $validator->errors()->all(),
                                'data' => array_slice($mappedRow, 0, 5),
                            ];
                        }
                        continue;
                    }
                }

                try {
                    $result = is_callable($processor)
                        ? $processor($mappedRow, $duplicateStrategy, $options)
                        : 'created';

                    if ($result === 'skipped') {
                        $skipped++;
                    } else {
                        $successful++;
                    }
                } catch (Exception $e) {
                    $failed++;
                    if (count($failures) < 500) {
                        $failures[] = [
                            'row' => $rowIndex + 2,
                            'errors' => [$e->getMessage()],
                            'data' => array_slice($mappedRow, 0, 5),
                        ];
                    }
                }

                // Periodically update progress
                if ($processed % 50 === 0) {
                    $import->update([
                        'processed_rows' => $processed,
                        'successful_rows' => $successful,
                        'failed_rows' => $failed,
                        'skipped_rows' => $skipped,
                    ]);
                }
            }

            $finalStatus = $failed > 0
                ? ($successful > 0 ? 'completed_with_errors' : 'failed')
                : 'completed';

            $import->update([
                'status' => $finalStatus,
                'processed_rows' => $processed,
                'successful_rows' => $successful,
                'failed_rows' => $failed,
                'skipped_rows' => $skipped,
                'errors_summary' => $failures,
                'completed_at' => now(),
            ]);
        } catch (Exception $e) {
            Log::error("Import processing error: {$e->getMessage()}", ['import_id' => $import->id]);
            $import->update([
                'status' => 'failed',
                'errors_summary' => ['exception' => $e->getMessage()],
                'completed_at' => now(),
            ]);
        }
    }

    /**
     * Map raw row headers to application fields.
     */
    protected static function transformRow(array $rawRow, array $mapping): array
    {
        $transformed = [];
        foreach ($mapping as $fileColumn => $appField) {
            if (empty($appField) || $appField === '__ignore__') {
                continue;
            }
            $transformed[$appField] = $rawRow[$fileColumn] ?? null;
        }
        return $transformed;
    }
}
