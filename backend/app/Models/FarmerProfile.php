<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FarmerProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'birthdate',
        'sex',
        'civil_status',
        'contact_number',
        'email',
        'street',
        'barangay',
        'municipality',
        'province',
        'ownership_information',
        'rsbsa_reference_number',
        'status',
        'verified_by',
        'verified_at',
        'archived_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
            'verified_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function fullName(): string
    {
        return trim(collect([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
            $this->suffix,
        ])->filter()->implode(' '));
    }

    public function addressLine(): string
    {
        return trim(collect([
            $this->street,
            $this->barangay,
            $this->municipality,
            $this->province,
        ])->filter()->implode(', '));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function farms(): HasMany
    {
        return $this->hasMany(Farm::class);
    }

    public function subsidies(): HasMany
    {
        return $this->hasMany(SubsidyRecord::class);
    }

    public function technicians(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'technician_farmer_assignments',
            'farmer_profile_id',
            'technician_user_id'
        )->withTimestamps();
    }
}
