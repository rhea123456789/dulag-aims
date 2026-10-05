<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ProductionRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'farm_id',
        'crop_type',
        'planting_date',
        'harvest_date',
        'quantity',
        'unit',
        'yield_per_hectare',
        'season',
        'notes',
        'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'planting_date' => 'date',
            'harvest_date' => 'date',
            'quantity' => 'decimal:2',
            'yield_per_hectare' => 'decimal:2',
        ];
    }

    public function farm(): BelongsTo
    {
        return $this->belongsTo(Farm::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function profit(): HasOne
    {
        return $this->hasOne(ProfitRecord::class);
    }
}
