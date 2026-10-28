<?php

namespace App\Services\ImportExport;

use Exception;
use Generator;
use ZipArchive;

class FileParser
{
    /**
     * Read the header row from a CSV or XLSX file.
     *
     * @return array<int, string>
     */
    public static function readHeaders(string $filePath, string $format = 'csv'): array
    {
        if (strtolower($format) === 'xlsx') {
            return self::readXlsxHeaders($filePath);
        }

        return self::readCsvHeaders($filePath);
    }

    /**
     * Read sample preview rows (e.g. first 5 rows).
     *
     * @return array<int, array<string, mixed>>
     */
    public static function readPreview(string $filePath, string $format = 'csv', int $limit = 5): array
    {
        $headers = self::readHeaders($filePath, $format);
        $preview = [];
        $count = 0;

        foreach (self::readRows($filePath, $format) as $row) {
            if ($count >= $limit) {
                break;
            }
            $preview[] = $row;
            $count++;
        }

        return [
            'headers' => $headers,
            'rows' => $preview,
        ];
    }

    /**
     * Count total data rows without exhausting memory.
     */
    public static function countRows(string $filePath, string $format = 'csv'): int
    {
        $count = 0;
        foreach (self::readRows($filePath, $format) as $_) {
            $count++;
        }

        return $count;
    }

    /**
     * Generator yielding associative rows matching headers.
     *
     * @return Generator<int, array<string, string>>
     */
    public static function readRows(string $filePath, string $format = 'csv'): Generator
    {
        if (strtolower($format) === 'xlsx') {
            yield from self::readXlsxRows($filePath);

            return;
        }

        yield from self::readCsvRows($filePath);
    }

    /**
     * Parse CSV headers.
     */
    protected static function readCsvHeaders(string $filePath): array
    {
        if (! file_exists($filePath) || ! is_readable($filePath)) {
            throw new Exception("File not found or unreadable at {$filePath}");
        }

        $handle = fopen($filePath, 'r');
        if (! $handle) {
            throw new Exception("Failed to open file {$filePath}");
        }

        // Handle possible UTF-8 BOM
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        $headers = fgetcsv($handle);
        fclose($handle);

        if (! $headers || ! is_array($headers)) {
            return [];
        }

        return array_values(array_filter(array_map('trim', $headers)));
    }

    /**
     * Parse CSV rows as generator.
     */
    protected static function readCsvRows(string $filePath): Generator
    {
        $handle = fopen($filePath, 'r');
        if (! $handle) {
            return;
        }

        // Handle possible UTF-8 BOM
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        $headers = fgetcsv($handle);
        if (! $headers || ! is_array($headers)) {
            fclose($handle);

            return;
        }

        $cleanHeaders = array_values(array_map('trim', $headers));

        $rowIndex = 0;
        while (($row = fgetcsv($handle)) !== false) {
            if (empty(array_filter($row, fn ($v) => trim((string) $v) !== ''))) {
                continue; // Skip empty rows
            }

            $assoc = [];
            foreach ($cleanHeaders as $index => $header) {
                $assoc[$header] = isset($row[$index]) ? trim((string) $row[$index]) : '';
            }

            yield $rowIndex => $assoc;
            $rowIndex++;
        }

        fclose($handle);
    }

    /**
     * Parse XLSX headers from worksheet XML.
     */
    protected static function readXlsxHeaders(string $filePath): array
    {
        $rows = self::readXlsxXmlRows($filePath, 1);

        return ! empty($rows) ? array_values(array_filter(array_map('trim', $rows[0]))) : [];
    }

    /**
     * Parse XLSX rows as generator.
     */
    protected static function readXlsxRows(string $filePath): Generator
    {
        $sharedStrings = self::getXlsxSharedStrings($filePath);
        $zip = new ZipArchive;
        if ($zip->open($filePath) !== true) {
            return;
        }

        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if (! $sheetXml) {
            return;
        }

        $xml = simplexml_load_string($sheetXml, 'SimpleXMLElement', LIBXML_NONET);
        if (! $xml || ! isset($xml->sheetData->row)) {
            return;
        }

        $headers = [];
        $isFirst = true;
        $rowIndex = 0;

        foreach ($xml->sheetData->row as $r) {
            $rowValues = [];
            foreach ($r->c as $c) {
                $val = (string) $c->v;
                $type = (string) $c['t'];

                if ($type === 's' && isset($sharedStrings[(int) $val])) {
                    $rowValues[] = trim((string) $sharedStrings[(int) $val]);
                } else {
                    $rowValues[] = trim($val);
                }
            }

            if ($isFirst) {
                $headers = $rowValues;
                $isFirst = false;

                continue;
            }

            if (empty(array_filter($rowValues, fn ($v) => $v !== ''))) {
                continue;
            }

            $assoc = [];
            foreach ($headers as $idx => $hdr) {
                $assoc[$hdr] = $rowValues[$idx] ?? '';
            }

            yield $rowIndex => $assoc;
            $rowIndex++;
        }
    }

    /**
     * Extract shared strings table from XLSX package.
     */
    protected static function getXlsxSharedStrings(string $filePath): array
    {
        $strings = [];
        $zip = new ZipArchive;
        if ($zip->open($filePath) === true) {
            $xmlString = $zip->getFromName('xl/sharedStrings.xml');
            if ($xmlString) {
                $xml = simplexml_load_string($xmlString, 'SimpleXMLElement', LIBXML_NONET);
                if ($xml && isset($xml->si)) {
                    foreach ($xml->si as $si) {
                        $strings[] = (string) ($si->t ?? $si->r->t ?? '');
                    }
                }
            }
            $zip->close();
        }

        return $strings;
    }

    /**
     * Helper to read limited rows from XLSX.
     */
    protected static function readXlsxXmlRows(string $filePath, int $maxRows = 1): array
    {
        $sharedStrings = self::getXlsxSharedStrings($filePath);
        $zip = new ZipArchive;
        if ($zip->open($filePath) !== true) {
            return [];
        }

        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if (! $sheetXml) {
            return [];
        }

        $xml = simplexml_load_string($sheetXml, 'SimpleXMLElement', LIBXML_NONET);
        if (! $xml || ! isset($xml->sheetData->row)) {
            return [];
        }

        $result = [];
        $count = 0;

        foreach ($xml->sheetData->row as $r) {
            $rowValues = [];
            foreach ($r->c as $c) {
                $val = (string) $c->v;
                $type = (string) $c['t'];

                if ($type === 's' && isset($sharedStrings[(int) $val])) {
                    $rowValues[] = trim((string) $sharedStrings[(int) $val]);
                } else {
                    $rowValues[] = trim($val);
                }
            }
            $result[] = $rowValues;
            $count++;
            if ($count >= $maxRows) {
                break;
            }
        }

        return $result;
    }
}
