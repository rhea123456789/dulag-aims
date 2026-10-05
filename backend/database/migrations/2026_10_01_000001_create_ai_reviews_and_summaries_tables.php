<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_reviews', function (Blueprint $table) {
            $table->id();
            $table->string('record_type');
            $table->json('record_ids');
            $table->json('ai_result')->nullable();
            $table->decimal('confidence', 5, 2)->nullable();
            $table->enum('status', ['pending', 'reviewed', 'confirmed', 'dismissed'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['record_type', 'status']);
        });

        Schema::create('ai_summaries', function (Blueprint $table) {
            $table->id();
            $table->text('generated_summary');
            $table->json('source_records');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_summaries');
        Schema::dropIfExists('ai_reviews');
    }
};
