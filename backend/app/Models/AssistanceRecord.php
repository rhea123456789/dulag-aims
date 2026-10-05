<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssistanceRecord extends Model
{
    protected $fillable = [
        'beneficiary_id',
        'subsidy_record_id',
        'assistance_type',
        'date_received',
        'description',
        'quantity_or_amount',
        'unit',
    ];

    protected function casts(): array
    {
        return [
            'date_received' => 'date',
            'quantity_or_amount' => 'decimal:2',
        ];
    }

    public function beneficiary(): BelongsTo
    {
        return $this->belongsTo(Beneficiary::class);
    }

    public function subsidy(): BelongsTo
    {
        return $this->belongsTo(SubsidyRecord::class, 'subsidy_record_id');
    }
}
