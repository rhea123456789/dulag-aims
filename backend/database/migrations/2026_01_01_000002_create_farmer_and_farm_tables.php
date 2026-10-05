<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('farmer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('suffix')->nullable();
            $table->date('birthdate')->nullable();
            $table->enum('sex', ['male', 'female', 'other'])->nullable();
            $table->string('civil_status')->nullable();
            $table->string('contact_number')->nullable()->index();
            $table->string('email')->nullable();
            $table->string('street')->nullable();
            $table->string('barangay');
            $table->string('municipality')->default('Dulag');
            $table->string('province')->default('Leyte');
            $table->string('ownership_information')->nullable();
            $table->string('rsbsa_reference_number')->nullable()->index();
            $table->enum('status', ['pending_verification', 'verified', 'active', 'archived'])->default('pending_verification');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('technician_farmer_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('technician_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('farmer_profile_id')->constrained('farmer_profiles')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['technician_user_id', 'farmer_profile_id'], 'technician_farmer_unique');
        });

        Schema::create('farms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farmer_profile_id')->constrained('farmer_profiles')->restrictOnDelete();
            $table->string('parcel_name')->nullable();
            $table->string('location');
            $table->string('barangay');
            $table->decimal('area_hectares', 10, 4);
            $table->string('land_classification')->nullable();
            $table->string('ownership_arrangement')->nullable();
            $table->text('cultivation_details')->nullable();
            $table->enum('status', ['active', 'inactive', 'archived'])->default('active');
            $table->timestamps();
        });

        Schema::create('farm_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farm_id')->constrained('farms')->cascadeOnDelete();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('changes');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('farm_history');
        Schema::dropIfExists('farms');
        Schema::dropIfExists('technician_farmer_assignments');
        Schema::dropIfExists('farmer_profiles');
    }
};
