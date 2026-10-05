<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\DuplicateReview;
use App\Models\Farm;
use App\Models\FarmerProfile;
use App\Models\Role;
use App\Services\AuditLogger;
use App\Services\DuplicateDetectionService;
use App\Services\GeminiDuplicateAssistant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DuplicateReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DuplicateReview::query()
            ->with('reviewer')
            ->when($request->status, fn ($q, $s) => $q->where('review_status', $s))
            ->orderByDesc('id');

        return response()->json($query->paginate(20));
    }

    public function show(DuplicateReview $duplicate): JsonResponse
    {
        return response()->json([
            'review' => $duplicate->load('reviewer'),
            'original' => $this->loadRecord($duplicate->original_type, $duplicate->original_id),
            'candidate' => $this->loadRecord($duplicate->duplicate_type, $duplicate->duplicate_id),
        ]);
    }

    public function scan(Request $request): JsonResponse
    {
        $counts = app(DuplicateDetectionService::class)->scanAll();
        app(AuditLogger::class)->record('Ran duplicate scan', 'duplicates', null, $counts);

        return response()->json([
            ...$counts,
            'message' => 'Records were flagged for human review. Nothing was merged or deleted.',
        ]);
    }

    public function assist(DuplicateReview $duplicate): JsonResponse
    {
        $summary = app(GeminiDuplicateAssistant::class)->explain($duplicate);
        app(AuditLogger::class)->record('Requested AI duplicate summary', 'duplicates', $duplicate);

        return response()->json([
            'gemini_summary' => $summary,
            'review' => $duplicate->fresh(),
            'notice' => 'AI output is advisory only. A human must decide the final action.',
        ]);
    }

    public function decide(Request $request, DuplicateReview $duplicate): JsonResponse
    {
        $data = $request->validate([
            'review_status' => ['required', Rule::in([
                'under_review',
                'confirmed_duplicate',
                'confirmed_distinct',
                'dismissed',
            ])],
            'final_action' => ['required', Rule::in([
                'none',
                'keep_both',
                'flag_for_manual_correction',
                'dismiss',
            ])],
            'reviewer_notes' => ['nullable', 'string'],
        ]);

        abort_if(in_array($data['final_action'], ['merge', 'delete'], true), 422, 'Automatic merge or delete is not allowed.');

        $duplicate->update([
            ...$data,
            'reviewer_id' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        app(AuditLogger::class)->record('Reviewed duplicate flag', 'duplicates', $duplicate, $data);

        return response()->json($duplicate);
    }

    private function loadRecord(string $type, int $id): mixed
    {
        return match ($type) {
            FarmerProfile::class => FarmerProfile::query()->find($id),
            Farm::class => Farm::query()->with('farmer')->find($id),
            default => null,
        };
    }
}
