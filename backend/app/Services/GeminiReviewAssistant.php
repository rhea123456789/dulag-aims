<?php

namespace App\Services;

use App\Models\AiReview;
use App\Models\DuplicateReview;

class GeminiReviewAssistant
{
    public function __construct(
        private GeminiClient $gemini,
        private RecordMinimizer $minimizer,
        private AiReviewStore $store,
    ) {}

    /**
     * Writes a suggestion onto the review. Source records are not changed.
     */
    public function explain(AiReview $review): AiReview
    {
        $payload = [
            'finding' => $review->ai_result['finding'] ?? 'possible_duplicate',
            'rule_hits' => $review->ai_result['rule_hits'] ?? [],
            'records' => $this->minimizer->forType($review->record_type, $review->record_ids ?? []),
        ];

        $prompt = "Compare these minimized agricultural records and explain why they may be duplicate, incomplete, inconsistent, or overlapping.\n"
            ."Return 1-3 sentences, then a final line exactly like SCORE: 70 if you can estimate similarity from 0 to 100.\n"
            .'Minimized JSON: '.json_encode($payload);

        $geminiText = $this->gemini->generate($prompt);
        $text = $geminiText ?? $this->fallback($review);
        $score = $this->scoreFrom($text);

        $result = $review->ai_result ?? [];
        $result['explanation'] = $this->stripScore($text);
        $result['source'] = $geminiText === null ? 'local_rules' : 'gemini';

        $review->update([
            'ai_result' => $result,
            'confidence' => $score ?? $review->confidence,
        ]);

        $this->mirrorDuplicateSummary($review, $result['explanation'], $result['source']);

        return $review->fresh();
    }

    private function fallback(AiReview $review): string
    {
        $finding = str_replace('_', ' ', (string) ($review->ai_result['finding'] ?? 'possible overlap'));
        $hits = implode(', ', $review->ai_result['rule_hits'] ?? []);
        $because = $hits !== '' ? " Shared signals: {$hits}." : '';

        return "These {$review->record_type} records may need review for {$finding}.{$because} A staff member must make the final decision.";
    }

    private function scoreFrom(string $text): ?float
    {
        if (! preg_match('/SCORE:\s*(\d{1,3})/i', $text, $match)) {
            return null;
        }

        return min(100, (float) $match[1]);
    }

    private function stripScore(string $text): string
    {
        return trim((string) preg_replace('/\s*SCORE:\s*\d{1,3}\s*$/i', '', $text));
    }

    private function mirrorDuplicateSummary(AiReview $review, string $explanation, string $source): void
    {
        $ids = $this->store->normalizeIds($review->record_ids ?? []);
        if (count($ids) !== 2) {
            return;
        }

        $duplicate = DuplicateReview::query()
            ->where('original_id', $ids[0])
            ->where('duplicate_id', $ids[1])
            ->first();

        if (! $duplicate) {
            return;
        }

        $duplicate->update([
            'gemini_summary' => $explanation,
            'detection_method' => $source === 'gemini' ? 'hybrid' : $duplicate->detection_method,
            'confidence' => $review->confidence,
        ]);
    }
}
