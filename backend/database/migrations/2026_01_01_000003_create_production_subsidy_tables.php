<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('production_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farm_id')->constrained('farms')->restrictOnDelete();
            $table->string('crop_type');
            $table->date('planting_date')->nullable();
            $table->date('harvest_date')->nullable();
            $table->decimal('quantity', 12, 2)->nullable();
            $table->string('unit')->default('kg');
            $table->decimal('yield_per_hectare', 12, 2)->nullable();
            $table->string('season')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('profit_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_record_id')->unique()->constrained('production_records')->restrictOnDelete();
            $table->decimal('expenses', 12, 2)->default(0);
            $table->decimal('income', 12, 2)->default(0);
            $table->decimal('profit', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('beneficiaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('farmer_profile_id')->nullable()->constrained('farmer_profiles')->nullOnDelete();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('contact_number')->nullable();
            $table->string('barangay');
            $table->string('address')->nullable();
            $table->enum('subsidy_status', ['none', 'pending', 'active', 'completed'])->default('none');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('subsidy_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farmer_profile_id')->nullable()->constrained('farmer_profiles')->nullOnDelete();
            $table->foreignId('beneficiary_id')->nullable()->constrained('beneficiaries')->nullOnDelete();
            $table->string('subsidy_type');
            $table->date('application_date');
            $table->enum('status', [
                'pending',
                'under_review',
                'approved',
                'released',
                'completed',
                'rejected',
            ])->default('pending');
            $table->decimal('amount', 12, 2)->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->text('distribution_information')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('assistance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('beneficiary_id')->constrained('beneficiaries')->cascadeOnDelete();
            $table->foreignId('subsidy_record_id')->nullable()->constrained('subsidy_records')->nullOnDelete();
            $table->string('assistance_type');
            $table->date('date_received');
            $table->string('description')->nullable();
            $table->decimal('quantity_or_amount', 12, 2)->nullable();
            $table->string('unit')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assistance_records');
        Schema::dropIfExists('subsidy_records');
        Schema::dropIfExists('beneficiaries');
        Schema::dropIfExists('profit_records');
        Schema::dropIfExists('production_records');
    }
};
