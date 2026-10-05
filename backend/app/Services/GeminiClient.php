<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiClient
{
    private const ATTEMPTS = 3;

    private string $notice = 'Gemini is temporarily unavailable. A fallback summary was generated.';

    /**
     * Advisory text only. Returns null when Gemini is disabled or still unavailable
     * after retries. The API key stays in Laravel configuration.
     */
    public function generate(string $prompt, int $maxTokens = 400): ?string
    {
        $this->notice = 'Gemini is temporarily unavailable. A fallback summary was generated.';

        if (! $this->isConfigured()) {
            return null;
        }

        $endpoint = str_replace(
            '{model}',
            (string) config('services.gemini.model'),
            (string) config('services.gemini.endpoint')
        );

        for ($attempt = 1; $attempt <= self::ATTEMPTS; $attempt++) {
            Log::info('Gemini request called', [
                'attempt' => $attempt,
                'model' => config('services.gemini.model'),
                'prompt_characters' => strlen($prompt),
            ]);

            try {
                $response = Http::timeout(25)
                    ->withQueryParameters(['key' => config('services.gemini.key')])
                    ->post($endpoint, [
                        'contents' => [
                            ['parts' => [['text' => $this->boundary().$prompt]]],
                        ],
                        'generationConfig' => [
                            'temperature' => 0.2,
                            'maxOutputTokens' => $maxTokens,
                        ],
                    ]);

                $text = $this->responseText($response);
                Log::info('Gemini response received', [
                    'attempt' => $attempt,
                    'status' => $response->status(),
                    'text_characters' => $text === null ? 0 : strlen($text),
                    'finish_reason' => data_get($response->json(), 'candidates.0.finishReason'),
                ]);

                if ($text !== null) {
                    return $text;
                }

                if ($response->successful()) {
                    Log::warning('Gemini response had no summary text', [
                        'attempt' => $attempt,
                        'finish_reason' => data_get($response->json(), 'candidates.0.finishReason'),
                    ]);

                    return null;
                }

                $this->logFailure($response, $attempt);
                if (! $this->shouldRetry($response) || $attempt === self::ATTEMPTS) {
                    return null;
                }

                $this->pause($response, $attempt);
            } catch (\Throwable $e) {
                Log::warning('Gemini request exception', [
                    'attempt' => $attempt,
                    'message' => $this->safeMessage($e),
                ]);
                if ($attempt === self::ATTEMPTS) {
                    return null;
                }

                usleep(300000 * $attempt);
            }
        }

        return null;
    }

    public function unavailableMessage(): string
    {
        return $this->notice;
    }

    public function isConfigured(): bool
    {
        return filter_var(config('services.gemini.enabled'), FILTER_VALIDATE_BOOLEAN)
            && filled(config('services.gemini.key'));
    }

    public function boundary(): string
    {
        return <<<'TEXT'
You assist Municipal Agriculture Office personnel in Dulag, Leyte.
Your output is a suggestion for human review only.
Do not recommend deletion, merging, approval, rejection, or declaring a record invalid.
Do not invent names, phone numbers, or reference numbers.
State that a staff member must make the final decision.

TEXT;
    }

    private function responseText(Response $response): ?string
    {
        $parts = data_get($response->json(), 'candidates.0.content.parts', []);
        if (! is_array($parts)) {
            return null;
        }

        $chunks = [];
        foreach ($parts as $part) {
            if (! is_array($part) || ! empty($part['thought'])) {
                continue;
            }
            $text = $part['text'] ?? null;
            if (is_string($text) && trim($text) !== '') {
                $chunks[] = trim($text);
            }
        }

        return $chunks === [] ? null : implode("\n", $chunks);
    }

    private function shouldRetry(Response $response): bool
    {
        if ($response->status() === 503) {
            return true;
        }

        return $response->status() === 429 && $this->retryDelaySeconds($response, 1) <= 15;
    }

    private function pause(Response $response, int $attempt): void
    {
        usleep((int) round($this->retryDelaySeconds($response, $attempt) * 1000000));
    }

    private function retryDelaySeconds(Response $response, int $attempt): float
    {
        if ($response->status() !== 429) {
            return 0.3 * $attempt;
        }

        $message = (string) data_get($response->json(), 'error.message');
        if (preg_match('/retry in ([0-9.]+)s/i', $message, $matches) === 1) {
            return (float) $matches[1] + 0.5;
        }

        return 8;
    }

    private function safeMessage(\Throwable $e): string
    {
        $message = preg_replace('/key=[^&\s"\']+/', 'key=[redacted]', $e->getMessage());

        return is_string($message) && $message !== '' ? $message : 'Gemini connection failed';
    }

    private function logFailure(Response $response, int $attempt): void
    {
        $error = data_get($response->json(), 'error.message');
        if (! is_string($error) || $error === '') {
            $error = $response->body();
        }

        Log::warning('Gemini request failed', [
            'attempt' => $attempt,
            'status' => $response->status(),
            'error' => $this->safeMessage(new \RuntimeException($error)),
        ]);
    }
}
