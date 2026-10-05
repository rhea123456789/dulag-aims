<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Farm extends Model
{
    use HasFactory;

    protected $fillable = [
        'farmer_profile_id',
        'parcel_name',
        'location',
        'barangay',
        'area_hectares',
        'land_classification',
        'ownership_arrangement',
        'cultivation_details',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'area_hectares' => 'decimal:4',
        ];
    }

    public function farmer(): BelongsTo
    {
        return $this->belongsTo(FarmerProfile::class, 'farmer_profile_id');
    }

    public function productions(): HasMany
    {
        return $this->hasMany(ProductionRecord::class);
    }

    public function history(): HasMany
    {
        return $this->hasMany(FarmHistory::class);
    }
}
