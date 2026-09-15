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
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->constrained()->cascadeOnDelete();

            $table->foreignId('parent_id')->nullable()
                ->constrained('menu_items')->cascadeOnDelete();

            $table->string('title');

            // Link options
            $table->string('url')->nullable();        // custom URL
            $table->string('route')->nullable();      // named route
            $table->json('route_params')->nullable(); // route params

            // Behavior
            $table->boolean('new_tab')->default(false);

            // UI options
            $table->string('icon')->nullable();       // e.g. "bi bi-house"
            $table->string('color')->nullable();      // text color
            $table->string('bg_color')->nullable();   // background
            $table->string('css_class')->nullable();  // custom class

            // Control
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
