<?php

namespace App\Services\Backup;

use App\Models\Backup;
use App\Services\ActivityLogger;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupService
{
    /**
     * Check if the environment can execute database backups.
     */
    public static function checkDependencies(): array
    {
        $connection = config('database.default');
        $driver = config("database.connections.{$connection}.driver");

        $status = [
            'driver' => $driver,
            'is_supported' => in_array($driver, ['mysql', 'sqlite', 'pgsql']),
            'available' => true,
            'message' => 'Ready for backup execution.',
            'recommended_action' => null,
        ];

        if ($driver === 'mysql') {
            // Check if mysqldump binary exists or if PHP PDO fallback is ready
            $hasDump = ! empty(shell_exec('which mysqldump 2>/dev/null')) || ! empty(shell_exec('where mysqldump 2>nul'));
            $status['has_binary'] = $hasDump;
            $status['strategy'] = $hasDump ? 'mysqldump_cli' : 'pdo_stream_export';
        } elseif ($driver === 'sqlite') {
            $databasePath = config("database.connections.{$connection}.database");
            $status['strategy'] = 'sqlite_snapshot';
            $status['database_exists'] = File::exists($databasePath);
        }

        return $status;
    }

    /**
     * Generate a new database backup snapshot.
     */
    public static function createBackup(?int $userId = null): Backup
    {
        $connection = config('database.default');
        $driver = config("database.connections.{$connection}.driver");
        $timestamp = date('Y-m-d_H-i-s');
        $filename = "backup_{$connection}_{$timestamp}.sql";
        $directory = 'backups';

        Storage::disk('local')->makeDirectory($directory);
        $relativeFilePath = "{$directory}/{$filename}";
        $fullPath = Storage::disk('local')->path($relativeFilePath);

        $backup = Backup::create([
            'filename' => $filename,
            'disk' => 'local',
            'path' => $relativeFilePath,
            'size_bytes' => 0,
            'driver' => $driver,
            'status' => 'processing',
            'created_by' => $userId,
        ]);

        try {
            if ($driver === 'sqlite') {
                $dbPath = config("database.connections.{$connection}.database");
                if ($dbPath === ':memory:') {
                    File::put($fullPath, "-- SQLite in-memory snapshot\n-- Generated ".date('Y-m-d H:i:s'));
                } else {
                    File::copy($dbPath, $fullPath);
                }
            } else {
                // Portable SQL table DDL & Data Dumper
                $handle = fopen($fullPath, 'w');
                fwrite($handle, "-- NextLaravel Database Snapshot\n");
                fwrite($handle, "-- Driver: {$driver}\n");
                fwrite($handle, '-- Date: '.date('Y-m-d H:i:s')."\n\n");
                fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\n\n");

                $tables = DB::connection()->getDoctrineSchemaManager()->listTableNames();
                foreach ($tables as $table) {
                    // Export Schema
                    fwrite($handle, "-- Table structure for `{$table}`\n");
                    fwrite($handle, "DROP TABLE IF EXISTS `{$table}`;\n");

                    try {
                        $createRow = DB::select("SHOW CREATE TABLE `{$table}`");
                        if (! empty($createRow)) {
                            $createSql = ((array) $createRow[0])['Create Table'];
                            fwrite($handle, $createSql.";\n\n");
                        }
                    } catch (Exception) {
                        // Fallback schema comment
                    }

                    // Export Rows
                    $rows = DB::table($table)->get();
                    if ($rows->isNotEmpty()) {
                        fwrite($handle, "-- Dumping data for `{$table}`\n");
                        foreach ($rows->chunk(100) as $chunk) {
                            foreach ($chunk as $row) {
                                $rowArray = (array) $row;
                                $columns = array_map(fn ($col) => "`{$col}`", array_keys($rowArray));
                                $values = array_map(function ($val) {
                                    if (is_null($val)) {
                                        return 'NULL';
                                    }

                                    return "'".addslashes((string) $val)."'";
                                }, array_values($rowArray));

                                fwrite($handle, "INSERT INTO `{$table}` (".implode(', ', $columns).') VALUES ('.implode(', ', $values).");\n");
                            }
                        }
                        fwrite($handle, "\n");
                    }
                }

                fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");
                fclose($handle);
            }

            $size = File::size($fullPath);

            $backup->update([
                'size_bytes' => $size,
                'status' => 'completed',
            ]);

            ActivityLogger::log(
                action: 'backup_created',
                description: "Created database backup: {$filename} (".format_bytes((int) $size).')',
                module: 'backups',
                newValues: ['filename' => $filename, 'size' => $size, 'driver' => $driver]
            );

            // Apply retention policy: keep last 10 backups
            self::applyRetentionPolicy(10);

            return $backup;
        } catch (Exception $e) {
            $backup->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            ActivityLogger::log(
                action: 'backup_failed',
                description: "Failed creating database backup: {$e->getMessage()}",
                module: 'backups',
                newValues: ['error' => $e->getMessage()]
            );

            throw $e;
        }
    }

    /**
     * Download backup file securely.
     */
    public static function download(Backup $backup): BinaryFileResponse
    {
        $fullPath = Storage::disk($backup->disk)->path($backup->path);

        if (! File::exists($fullPath)) {
            abort(404, 'Backup file not found on disk.');
        }

        ActivityLogger::log(
            action: 'backup_downloaded',
            description: "Downloaded database backup {$backup->filename}",
            module: 'backups',
            newValues: ['filename' => $backup->filename]
        );

        return response()->download($fullPath, $backup->filename);
    }

    /**
     * Delete backup record and remove file.
     */
    public static function delete(Backup $backup): void
    {
        $fullPath = Storage::disk($backup->disk)->path($backup->path);
        if (File::exists($fullPath)) {
            File::delete($fullPath);
        }

        ActivityLogger::log(
            action: 'backup_deleted',
            description: "Deleted backup archive {$backup->filename}",
            module: 'backups',
            newValues: ['filename' => $backup->filename]
        );

        $backup->delete();
    }

    /**
     * Automatically delete older backups keeping the specified retention count.
     */
    public static function applyRetentionPolicy(int $keepCount = 10): void
    {
        $oldBackups = Backup::where('status', 'completed')
            ->latest()
            ->skip($keepCount)
            ->take(100)
            ->get();

        foreach ($oldBackups as $old) {
            self::delete($old);
        }
    }
}
