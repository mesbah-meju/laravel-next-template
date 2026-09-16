<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->string('subject');
            $table->longText('html_content');
            $table->text('plain_content')->nullable();
            $table->json('variables')->nullable(); // Whitelisted tokens e.g. ['user_name', 'app_name', 'action_url']
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('notification_templates', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->string('title');
            $table->text('message');
            $table->json('channels')->nullable(); // e.g. ['database', 'email']
            $table->json('variables')->nullable(); // Whitelisted tokens
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_templates');
        Schema::dropIfExists('email_templates');
    }
};
