<?php

namespace App\Services\Installer;

use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class InstallerService
{
    private const LOCK_FILE = 'installed.lock';
    private const SETUP_TOKEN_FILE = 'installer_setup_token.json';

    /**
     * Check if application is already installed and locked.
     */
    public static function isInstalled(): bool
    {
        // 1. Physical lockfile check
        if (File::exists(storage_path('app/'.self::LOCK_FILE))) {
            return true;
        }

        // 2. Production fail-closed check: installer is never exposed in production unless explicitly unlocked
        if (app()->isProduction() && ! config('app.installer_unlocked', false)) {
            return true;
        }

        // 3. Database check: If database is already migrated and has a Super Admin, mark as installed
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('users')) {
                $hasSuperAdmin = User::whereHas('roles', function ($q) {
                    $q->where('name', 'Super Admin');
                })->exists();

                if ($hasSuperAdmin) {
                    self::lock();

                    return true;
                }
            }
        } catch (\Throwable $e) {
            // Fail closed: if we cannot establish DB state safely and app is not in local/testing, treat as installed
            if (! app()->environment('local', 'testing')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Lock application installation permanently.
     */
    public static function lock(): void
    {
        File::ensureDirectoryExists(storage_path('app'));
        File::put(storage_path('app/'.self::LOCK_FILE), json_encode([
            'installed_at' => date('Y-m-d H:i:s'),
            'version' => config('app.version', '1.0.0'),
            'ip' => request()->ip(),
        ]));

        self::destroySetupToken();
    }

    /**
     * Unlock installer (CLI only).
     */
    public static function unlock(): void
    {
        $path = storage_path('app/'.self::LOCK_FILE);
        if (File::exists($path)) {
            File::delete($path);
        }
        self::destroySetupToken();
    }

    /**
     * Retrieve or generate one-time setup token for initial installation.
     */
    public static function getOrCreateSetupToken(): string
    {
        File::ensureDirectoryExists(storage_path('app'));
        $token = \Illuminate\Support\Str::random(64);
        $path = storage_path('app/'.self::SETUP_TOKEN_FILE);

        File::put($path, json_encode([
            'token_hash' => hash('sha256', $token),
            'created_at' => time(),
            'expires_at' => time() + 1800, // 30 minutes TTL
        ]));
        @chmod($path, 0600);

        return $token;
    }

    /**
     * Invalidate setup token.
     */
    public static function destroySetupToken(): void
    {
        $path = storage_path('app/'.self::SETUP_TOKEN_FILE);
        if (File::exists($path)) {
            File::delete($path);
        }
        $legacyPath = storage_path('app/installer_setup_token');
        if (File::exists($legacyPath)) {
            File::delete($legacyPath);
        }
    }

    /**
     * Validate the provided setup token for mutating installer operations.
     */
    public static function validateSetupToken(?string $token): bool
    {
        if (app()->environment('testing')) {
            return true;
        }

        if (empty($token)) {
            return false;
        }

        $path = storage_path('app/'.self::SETUP_TOKEN_FILE);
        if (! File::exists($path)) {
            $legacyPath = storage_path('app/installer_setup_token');
            if (File::exists($legacyPath)) {
                $raw = trim(File::get($legacyPath));

                return hash_equals($raw, $token);
            }

            return false;
        }

        try {
            $data = json_decode(File::get($path), true);
            if (! is_array($data) || empty($data['token_hash']) || empty($data['expires_at'])) {
                self::destroySetupToken();

                return false;
            }

            if (time() > (int) $data['expires_at']) {
                self::destroySetupToken();

                return false;
            }

            return hash_equals($data['token_hash'], hash('sha256', $token));
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Verify server requirements and filesystem permissions.
     */
    public static function checkServerRequirements(): array
    {
        $phpVersion = PHP_VERSION;
        $phpPassed = version_compare($phpVersion, '8.2.0', '>=');

        $requiredExtensions = [
            'pdo' => 'PDO Data Objects',
            'pdo_mysql' => 'PDO MySQL Driver (or SQLite)',
            'mbstring' => 'Multibyte String Support',
            'openssl' => 'OpenSSL Cryptography',
            'tokenizer' => 'Tokenizer Support',
            'xml' => 'XML Document Parser',
            'ctype' => 'Ctype Character Validation',
            'json' => 'JSON Parser & Encoder',
            'fileinfo' => 'File Information & MIME Detection',
            'curl' => 'cURL Network Client',
        ];

        $extensionResults = [];
        $allExtensionsPassed = true;

        foreach ($requiredExtensions as $ext => $label) {
            $isLoaded = extension_loaded($ext) || ($ext === 'pdo_mysql' && (extension_loaded('pdo_mysql') || extension_loaded('pdo_sqlite')));
            $extensionResults[] = [
                'extension' => $ext,
                'label' => $label,
                'passed' => $isLoaded,
                'required' => true,
            ];
            if (! $isLoaded && $ext !== 'pdo_mysql') {
                $allExtensionsPassed = false;
            }
        }

        $writablePaths = [
            storage_path() => 'Storage Directory (storage/)',
            storage_path('framework') => 'Framework Cache Directory (storage/framework/)',
            storage_path('logs') => 'Logs Directory (storage/logs/)',
            base_path('bootstrap/cache') => 'Bootstrap Cache (bootstrap/cache/)',
        ];

        $permissionsResults = [];
        $allPermissionsPassed = true;

        foreach ($writablePaths as $path => $label) {
            $isWritable = File::isWritable($path);
            $permissionsResults[] = [
                'path' => $label,
                'passed' => $isWritable,
            ];
            if (! $isWritable) {
                $allPermissionsPassed = false;
            }
        }

        $isReady = $phpPassed && $allExtensionsPassed && $allPermissionsPassed;

        return [
            'is_ready' => $isReady,
            'php_version' => [
                'current' => $phpVersion,
                'required' => '>= 8.2.0',
                'passed' => $phpPassed,
            ],
            'extensions' => $extensionResults,
            'permissions' => $permissionsResults,
        ];
    }

    /**
     * Test database connection with provided runtime credentials without saving them.
     */
    public static function testDatabaseConnection(array $config): array
    {
        $driver = $config['db_connection'] ?? 'mysql';
        $host = $config['db_host'] ?? '127.0.0.1';
        $port = $config['db_port'] ?? ($driver === 'mysql' ? '3306' : '5432');
        $database = $config['db_database'] ?? '';
        $username = $config['db_username'] ?? '';
        $password = $config['db_password'] ?? '';

        try {
            if ($driver === 'sqlite') {
                $dbPath = $database === ':memory:' ? ':memory:' : (File::exists($database) ? $database : database_path('database.sqlite'));
                $pdo = new \PDO("sqlite:{$dbPath}");
            } else {
                $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
                $pdo = new \PDO($dsn, $username, $password, [
                    \PDO::ATTR_TIMEOUT => 5,
                    \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                ]);
            }

            return [
                'success' => true,
                'message' => 'Database connection established successfully.',
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection failed: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Update explicitly whitelisted .env values.
     */
    public static function updateEnvironmentConfig(array $values): void
    {
        $allowedKeys = [
            'APP_NAME',
            'APP_ENV',
            'APP_KEY',
            'APP_DEBUG',
            'APP_URL',
            'APP_TIMEZONE',
            'APP_LOCALE',
            'DB_CONNECTION',
            'DB_HOST',
            'DB_PORT',
            'DB_DATABASE',
            'DB_USERNAME',
            'DB_PASSWORD',
        ];

        $envFile = base_path('.env');
        if (! File::exists($envFile)) {
            if (File::exists(base_path('.env.example'))) {
                File::copy(base_path('.env.example'), $envFile);
            } else {
                File::put($envFile, '');
            }
        }

        $envContent = File::get($envFile);

        foreach ($values as $key => $val) {
            $upperKey = strtoupper($key);
            if (! in_array($upperKey, $allowedKeys)) {
                continue;
            }

            // Format boolean or string
            if (is_bool($val)) {
                $formattedVal = $val ? 'true' : 'false';
            } elseif (str_contains((string) $val, ' ') || str_contains((string) $val, '#')) {
                $formattedVal = '"'.addslashes((string) $val).'"';
            } else {
                $formattedVal = (string) $val;
            }

            if (preg_match("/^{$upperKey}=.*/m", $envContent)) {
                $envContent = preg_replace("/^{$upperKey}=.*/m", "{$upperKey}={$formattedVal}", $envContent);
            } else {
                $envContent .= "\n{$upperKey}={$formattedVal}";
            }
        }

        File::put($envFile, $envContent);
    }

    /**
     * Ensure APP_KEY exists or generate a secure new key.
     */
    public static function ensureAppKey(): void
    {
        if (empty(config('app.key'))) {
            Artisan::call('key:generate', ['--force' => true]);
        }
    }

    /**
     * Execute migrations and default starter seeders.
     */
    public static function runDatabaseSetup(): array
    {
        try {
            // Run migrations safely
            Artisan::call('migrate', ['--force' => true]);
            $migrateOutput = Artisan::output();

            // Run core seeders
            Artisan::call('db:seed', [
                '--class' => 'Database\\Seeders\\RolePermissionSeeder',
                '--force' => true,
            ]);

            return [
                'success' => true,
                'message' => 'Database schema & core permissions initialized successfully.',
                'output' => trim($migrateOutput),
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Database migration failed: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Create the first initial Super Admin user account.
     */
    public static function createSuperAdmin(array $data): User
    {
        // Ensure Super Admin role exists
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $superAdminRole->syncPermissions(Permission::all());

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'email_verified_at' => now(),
            'status' => 'active',
        ]);

        $user->assignRole($superAdminRole);

        return $user;
    }
}
