<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Beneficiary extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'farmer_profile_id',
        'first_name',
        'middle_name',
        'last_name',
        'contact_number',
        'barangay',
        'address',
        'subsidy_status',
        'notes',
    ];

    public function fullName(): string
    {
        return trim(collect([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
        ])->filter()->implode(' '));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function farmer(): BelongsTo
    {
        return $this->belongsTo(FarmerProfile::class, 'farmer_profile_id');
    }

    public function subsidies(): HasMany
    {
        return $this->hasMany(SubsidyRecord::class);
    }

    public function assistance(): HasMany
    {
        return $this->hasMany(AssistanceRecord::class);
    }
}
