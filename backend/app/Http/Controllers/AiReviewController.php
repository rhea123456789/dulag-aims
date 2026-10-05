<?php

namespace App\Http\Controllers;

use App\Models\AiReview;
use App\Models\Beneficiary;
use App\Models\DuplicateReview;
use App\Models\Farm;
use App\Models\FarmerProfile;
use App\Models\SubsidyRecord;
use App\Services\AiReviewStore;
use App\Services\AuditLogger;
use App\Services\DuplicateDetectionService;
use App\Services\GeminiReviewAssistant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AiReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AiReview::query()
            ->with('reviewer:id,name')
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->orderByDesc('id');

        $page = $query->paginate(20);
        $page->getCollection()->transform(fn (AiReview $review) => $this->present($review));

        return response()->json($page);
    }

    public function scan(Request $request): JsonResponse
    {
        $counts = app(DuplicateDetectionService::class)->scanAll();
        app(AuditLogger::class)->record('Ran AI duplicate scan', 'ai_reviews', null, $counts);

        return response()->json([
            ...$counts,
            'message' => 'Records were flagged for human review. Nothing was merged, deleted, approved, or rejected.',
        ]);
    }

    public function assist(AiReview $aiReview): JsonResponse
    {
        $review = app(GeminiReviewAssistant::class)->explain($aiReview);
        app(AuditLogger::class)->record('Requested Gemini duplicate suggestion', 'ai_reviews', $review, [
            'source' => $review->ai_result['source'] ?? null,
        ]);

        return response()->json([
            'review' => $this->present($review),
            'notice' => 'AI output is advisory only. A staff member must decide. Records were not merged or deleted.',
        ]);
    }

    public function decide(Request $request, AiReview $aiReview): JsonResponse
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(['keep_both', 'mark_for_correction', 'dismiss'])],
        ]);

        abort_if(in_array($data['action'], ['merge', 'delete', 'approve', 'reject'], true), 422, 'Automatic merge, delete, approval, or rejection is not allowed.');

        $status = match ($data['action']) {
            'keep_both' => 'confirmed',
            'mark_for_correction' => 'reviewed',
            'dismiss' => 'dismissed',
        };

        $aiReview->update([
            'status' => $status,
            'reviewed_by' => $request->user()->id,
        ]);

        $this->syncDuplicateReview($aiReview, $data['action']);
        app(AuditLogger::class)->record('Reviewed AI suggestion', 'ai_reviews', $aiReview, $data);

        return response()->json($this->present($aiReview->fresh()->load('reviewer:id,name')));
    }

    private function syncDuplicateReview(AiReview $review, string $action): void
    {
        $ids = app(AiReviewStore::class)->normalizeIds($review->record_ids ?? []);
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

        [$reviewStatus, $finalAction] = match ($action) {
            'keep_both' => ['confirmed_distinct', 'keep_both'],
            'mark_for_correction' => ['under_review', 'flag_for_manual_correction'],
            'dismiss' => ['dismissed', 'dismiss'],
        };

        $duplicate->update([
            'review_status' => $reviewStatus,
            'final_action' => $finalAction,
            'reviewer_id' => $review->reviewed_by,
            'reviewed_at' => now(),
        ]);
    }

    private function present(AiReview $review): array
    {
        return [
            'id' => $review->id,
            'record_type' => $review->record_type,
            'record_ids' => $review->record_ids,
            'ai_result' => $review->ai_result,
            'confidence' => $review->confidence,
            'status' => $review->status,
            'reviewed_by' => $review->reviewer?->name,
            'created_at' => $review->created_at,
            'records' => $this->displayRecords($review),
        ];
    }

    private function displayRecords(AiReview $review): array
    {
        $ids = $review->record_ids ?? [];

        return array_values(array_filter(array_map(function ($id) use ($review) {
            $id = (int) $id;

            return match ($review->record_type) {
                'farmer' => $this->farmerCard(FarmerProfile::query()->find($id)),
                'farm' => $this->farmCard(Farm::query()->with('farmer')->find($id)),
                'beneficiary' => $this->beneficiaryCard(Beneficiary::query()->find($id)),
                'subsidy' => $this->subsidyCard(SubsidyRecord::query()->find($id)),
                default => null,
            };
        }, $ids)));
    }

    private function farmerCard(?FarmerProfile $farmer): ?array
    {
        if (! $farmer) {
            return null;
        }

        return [
            'id' => $farmer->id,
            'label' => $farmer->fullName(),
            'detail' => $farmer->barangay.', '.$farmer->status,
        ];
    }

    private function farmCard(?Farm $farm): ?array
    {
        if (! $farm) {
            return null;
        }

        return [
            'id' => $farm->id,
            'label' => $farm->location,
            'detail' => $farm->barangay.' · '.$farm->area_hectares.' ha',
        ];
    }

    private function beneficiaryCard(?Beneficiary $beneficiary): ?array
    {
        if (! $beneficiary) {
            return null;
        }

        return [
            'id' => $beneficiary->id,
            'label' => $beneficiary->fullName(),
            'detail' => $beneficiary->barangay.' · '.($beneficiary->subsidy_status ?: 'no status'),
        ];
    }

    private function subsidyCard(?SubsidyRecord $subsidy): ?array
    {
        if (! $subsidy) {
            return null;
        }

        return [
            'id' => $subsidy->id,
            'label' => $subsidy->subsidy_type,
            'detail' => $subsidy->status.' · '.$subsidy->application_date?->toDateString(),
        ];
    }
}
