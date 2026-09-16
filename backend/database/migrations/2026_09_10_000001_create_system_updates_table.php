<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_updates', function (Blueprint $table) {
            $table->id();
            $table->string('version_from');
            $table->string('version_to');
            $table->string('status')->default('completed'); // checking, backing_up, updating, migrating, verifying, completed, failed
            $table->string('backup_reference')->nullable();
            $table->text('release_notes')->nullable();
            $table->text('error_details')->nullable();
            $table->foreignId('started_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_updates');
    }
};
