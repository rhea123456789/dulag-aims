<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DuplicateReview extends Model
{
    protected $fillable = [
        'original_type',
        'original_id',
        'duplicate_type',
        'duplicate_id',
        'detection_method',
        'rule_hits',
        'confidence',
        'gemini_summary',
        'review_status',
        'reviewer_id',
        'final_action',
        'reviewed_at',
        'reviewer_notes',
    ];

    protected function casts(): array
    {
        return [
            'rule_hits' => 'array',
            'confidence' => 'decimal:2',
            'reviewed_at' => 'datetime',
        ];
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
