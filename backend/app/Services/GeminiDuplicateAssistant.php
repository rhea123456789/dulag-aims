<?php

namespace App\Services;

use App\Models\DuplicateReview;
use App\Models\Farm;
use App\Models\FarmerProfile;

class GeminiDuplicateAssistant
{
    /**
     * Explains an existing farmer or farm flag. Records are not changed.
     */
    public function explain(DuplicateReview $review): ?string
    {
        $type = match ($review->original_type) {
            FarmerProfile::class => 'farmer',
            Farm::class => 'farm',
            default => 'record',
        };

        $store = app(AiReviewStore::class);
        $ids = [$review->original_id, $review->duplicate_id];
        $aiReview = $store->findPair($type, $ids) ?? $store->flag($type, $ids, [
            'finding' => 'possible_duplicate',
            'rule_hits' => $review->rule_hits ?? [],
            'explanation' => null,
            'advisory' => true,
        ], $review->confidence !== null ? (float) $review->confidence : null);

        if (! $aiReview) {
            return null;
        }

        $updated = app(GeminiReviewAssistant::class)->explain($aiReview);

        return $updated->ai_result['explanation'] ?? null;
    }
}
