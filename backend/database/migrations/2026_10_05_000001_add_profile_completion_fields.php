<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('farmer_profiles', function (Blueprint $table) {
            $table->string('place_of_birth')->nullable();
            $table->string('sitio')->nullable();
            $table->string('region')->nullable();
            $table->string('education_level')->nullable();
            $table->string('livelihood_type')->nullable();
            $table->string('association_name')->nullable();
            $table->timestamp('profile_completed_at')->nullable();
        });

        Schema::table('beneficiaries', function (Blueprint $table) {
            $table->string('suffix')->nullable();
            $table->date('birthdate')->nullable();
            $table->string('place_of_birth')->nullable();
            $table->enum('sex', ['male', 'female', 'other'])->nullable();
            $table->string('civil_status')->nullable();
            $table->string('street')->nullable();
            $table->string('sitio')->nullable();
            $table->string('municipality')->nullable();
            $table->string('province')->nullable();
            $table->string('region')->nullable();
            $table->string('education_level')->nullable();
            $table->string('livelihood_type')->nullable();
            $table->string('association_name')->nullable();
            $table->timestamp('profile_completed_at')->nullable();
        });

        Schema::table('farms', function (Blueprint $table) {
            $table->string('land_owner_name')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('farmer_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'place_of_birth', 'sitio', 'region', 'education_level',
                'livelihood_type', 'association_name', 'profile_completed_at',
            ]);
        });

        Schema::table('beneficiaries', function (Blueprint $table) {
            $table->dropColumn([
                'suffix', 'birthdate', 'place_of_birth', 'sex', 'civil_status',
                'street', 'sitio', 'municipality', 'province', 'region',
                'education_level', 'livelihood_type', 'association_name', 'profile_completed_at',
            ]);
        });

        Schema::table('farms', function (Blueprint $table) {
            $table->dropColumn('land_owner_name');
        });
    }
};
