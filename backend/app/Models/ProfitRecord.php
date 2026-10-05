<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfitRecord extends Model
{
    protected $fillable = [
        'production_record_id',
        'expenses',
        'income',
        'profit',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'expenses' => 'decimal:2',
            'income' => 'decimal:2',
            'profit' => 'decimal:2',
        ];
    }

    public static function computeProfit(float $income, float $expenses): float
    {
        return round($income - $expenses, 2);
    }

    public function production(): BelongsTo
    {
        return $this->belongsTo(ProductionRecord::class, 'production_record_id');
    }
}
