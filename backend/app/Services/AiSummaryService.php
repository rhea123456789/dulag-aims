<?php

namespace App\Services;

use App\Models\AiSummary;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AiSummaryService
{
    public function __construct(
        private GeminiClient $gemini,
        private RecordMinimizer $minimizer,
    ) {}

    /**
     * Stores a readable summary. Does not change the source records.
     */
    public function generate(User $user, string $recordType, array $ids): AiSummary
    {
        $ids = array_values(array_unique(array_map('intval', $ids)));
        $packet = $this->minimizer->briefing($recordType, $ids);
        $prompt = $this->prompt($packet);

        $notice = null;
        Log::info('AI summary Gemini request', [
            'record_type' => $recordType,
            'record_ids' => $ids,
            'configured' => $this->gemini->isConfigured(),
        ]);

        if ($this->gemini->isConfigured()) {
            Log::info('AI summary prompt', [
                'record_type' => $recordType,
                'selected_records' => count($ids),
                'prompt_characters' => strlen($prompt),
                'prompt_excerpt' => substr($prompt, 0, 500),
            ]);
            $summary = $this->gemini->generate($prompt, 300);
            Log::info('AI summary Gemini response', [
                'record_type' => $recordType,
                'text_received' => $summary !== null,
                'text_characters' => $summary === null ? 0 : strlen($summary),
            ]);
            if ($summary === null) {
                $summary = $this->localSummary($recordType, $packet['selected']);
                $source = 'fallback';
                $notice = $this->gemini->unavailableMessage();
            } else {
                $source = 'gemini';
            }
        } else {
            $summary = $this->localSummary($recordType, $packet['selected']);
            $source = 'local_rules';
        }

        $saved = AiSummary::query()->create([
            'generated_summary' => $summary,
            'source_records' => [
                'record_type' => $recordType,
                'record_ids' => $ids,
                'source' => $source,
                'notice' => $notice,
            ],
            'created_by' => $user->id,
        ]);

        Log::info('AI summary saved', [
            'summary_id' => $saved->id,
            'source' => $source,
            'summary_characters' => strlen($summary),
        ]);

        return $saved;
    }

    private function prompt(array $packet): string
    {
        return <<<PROMPT
Summarize the selected agriculture records.

Include:
- farmer information
- farm details
- production details
- assistance records
- important observations

Rules:
- Use only provided data.
- Do not invent information.
- Do not predict future results.
- Do not approve, reject, merge, or delete records.
- Keep the summary concise.

Records:
PROMPT
            .json_encode($packet);
    }

    private function localSummary(string $recordType, array $minimized): string
    {
        $lines = array_map(function (array $row) {
            $kind = $row['kind'] ?? 'record';
            $place = $row['barangay'] ?? 'an unspecified barangay';

            return $kind.' record in '.$place;
        }, $minimized);
        $described = $lines === [] ? 'No matching records were found.' : implode('; ', $lines);

        return "Descriptive summary of {$recordType} records. Gemini was not called. {$described}. "
            .'This note does not approve, reject, merge, or delete any record.';
    }
}
