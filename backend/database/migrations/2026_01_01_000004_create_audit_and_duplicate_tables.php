<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->string('module');
            $table->nullableMorphs('record');
            $table->json('changes')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });

        Schema::create('duplicate_reviews', function (Blueprint $table) {
            $table->id();
            $table->string('original_type');
            $table->unsignedBigInteger('original_id');
            $table->string('duplicate_type');
            $table->unsignedBigInteger('duplicate_id');
            $table->enum('detection_method', ['rule', 'gemini', 'hybrid'])->default('rule');
            $table->json('rule_hits')->nullable();
            $table->decimal('confidence', 5, 2)->nullable();
            $table->text('gemini_summary')->nullable();
            $table->enum('review_status', [
                'pending',
                'under_review',
                'confirmed_duplicate',
                'confirmed_distinct',
                'dismissed',
            ])->default('pending');
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('final_action', [
                'none',
                'keep_both',
                'flag_for_manual_correction',
                'dismiss',
            ])->default('none');
            $table->timestamp('reviewed_at')->nullable();
            $table->text('reviewer_notes')->nullable();
            $table->timestamps();

            $table->index(['original_type', 'original_id']);
            $table->index(['duplicate_type', 'duplicate_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('duplicate_reviews');
        Schema::dropIfExists('audit_logs');
    }
};
