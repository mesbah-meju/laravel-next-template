<?php

namespace App\Services\ImportExport;

use Exception;
use Illuminate\Database\Eloquent\Builder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportProcessor
{
    /**
     * Generate streamed CSV response.
     */
    public static function streamCsv(
        string $exportKey,
        array $options = []
    ): StreamedResponse {
        $definition = ExportRegistry::get($exportKey);
        if (! $definition) {
            throw new Exception("Unknown export type: {$exportKey}");
        }

        $filename = ($options['filename'] ?? $exportKey.'_export_'.date('Y_m_d_His')).'.csv';

        $query = self::buildQuery($definition, $options);
        $columns = $definition['columns'];

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($query, $columns) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fwrite($handle, "\xEF\xBB\xBF");

            // Header row
            fputcsv($handle, array_column($columns, 'label'));

            // Stream chunks
            $query->chunk(200, function ($records) use ($handle, $columns) {
                foreach ($records as $record) {
                    $row = [];
                    foreach ($columns as $col) {
                        $key = $col['key'];
                        $val = isset($col['format']) && is_callable($col['format'])
                            ? $col['format']($record)
                            : data_get($record, $key, '');

                        // Guard against CSV / Spreadsheet formula injection
                        if (is_string($val) && strlen($val) > 0 && in_array($val[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
                            $val = "'".$val;
                        }

                        $row[] = $val;
                    }
                    fputcsv($handle, $row);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Build the query applying optional filters, sorting, and selected IDs.
     */
    protected static function buildQuery(array $definition, array $options): Builder
    {
        $queryFactory = $definition['query'];
        $query = is_callable($queryFactory) ? $queryFactory() : $queryFactory;

        if (! empty($options['selected_ids']) && is_array($options['selected_ids'])) {
            $query->whereIn('id', $options['selected_ids']);

            return $query;
        }

        if (! empty($options['search'])) {
            $search = $options['search'];
            if (method_exists($query->getModel(), 'scopeSearch')) {
                $query->search($search);
            }
        }

        if (! empty($options['sort_by'])) {
            $direction = strtolower($options['sort_direction'] ?? 'asc') === 'desc' ? 'desc' : 'asc';
            $query->orderBy($options['sort_by'], $direction);
        }

        return $query;
    }
}
