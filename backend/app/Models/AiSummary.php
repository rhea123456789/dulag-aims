<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiSummary extends Model
{
    protected $fillable = [
        'generated_summary',
        'source_records',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'source_records' => 'array',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
