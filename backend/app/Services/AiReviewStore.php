<?php

namespace App\Services;

use App\Models\AiReview;

class AiReviewStore
{
    /**
     * Saves a reviewable flag. Never changes the source agricultural record.
     */
    public function flag(string $recordType, array $ids, array $result, ?float $confidence): ?AiReview
    {
        $ids = $this->normalizeIds($ids);
        if ($ids === [] || $this->exists($recordType, $ids)) {
            return null;
        }

        return AiReview::query()->create([
            'record_type' => $recordType,
            'record_ids' => $ids,
            'ai_result' => $result,
            'confidence' => $confidence,
            'status' => 'pending',
        ]);
    }

    public function findPair(string $recordType, array $ids): ?AiReview
    {
        $ids = $this->normalizeIds($ids);

        return AiReview::query()
            ->where('record_type', $recordType)
            ->get()
            ->first(fn (AiReview $review) => $this->normalizeIds($review->record_ids ?? []) === $ids);
    }

    public function exists(string $recordType, array $ids): bool
    {
        return $this->findPair($recordType, $ids) !== null;
    }

    public function normalizeIds(array $ids): array
    {
        $ids = array_values(array_unique(array_map('intval', $ids)));
        sort($ids);

        return array_values(array_filter($ids, fn (int $id) => $id > 0));
    }
}
