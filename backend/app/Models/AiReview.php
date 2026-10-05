<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiReview extends Model
{
    protected $fillable = [
        'record_type',
        'record_ids',
        'ai_result',
        'confidence',
        'status',
        'reviewed_by',
    ];

    protected function casts(): array
    {
        return [
            'record_ids' => 'array',
            'ai_result' => 'array',
            'confidence' => 'decimal:2',
        ];
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
