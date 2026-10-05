<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubsidyRecord extends Model
{
    use HasFactory;

    public const STATUSES = [
        'pending',
        'under_review',
        'approved',
        'released',
        'completed',
        'rejected',
    ];

    protected $fillable = [
        'farmer_profile_id',
        'beneficiary_id',
        'subsidy_type',
        'application_date',
        'status',
        'amount',
        'approved_by',
        'approved_at',
        'released_at',
        'distribution_information',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'application_date' => 'date',
            'amount' => 'decimal:2',
            'approved_at' => 'datetime',
            'released_at' => 'datetime',
        ];
    }

    public function farmer(): BelongsTo
    {
        return $this->belongsTo(FarmerProfile::class, 'farmer_profile_id');
    }

    public function beneficiary(): BelongsTo
    {
        return $this->belongsTo(Beneficiary::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function assistance(): HasMany
    {
        return $this->hasMany(AssistanceRecord::class);
    }
}
