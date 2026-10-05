<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\SubsidyRecord;
use App\Services\AuditLogger;
use App\Support\ScopeQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubsidyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = SubsidyRecord::query()->with(['farmer', 'beneficiary', 'approver']);

        if ($user->hasRole(Role::FARMER)) {
            $query->whereHas('farmer', fn ($q) => $q->where('user_id', $user->id));
        } elseif ($user->hasRole(Role::BENEFICIARY)) {
            $query->whereHas('beneficiary', fn ($q) => $q->where('user_id', $user->id));
        } elseif ($user->hasRole(Role::TECHNICIAN)) {
            $ids = ScopeQuery::farmers($user)->pluck('id');
            $query->whereIn('farmer_profile_id', $ids);
        } elseif (! $user->hasRole(Role::MAO_PERSONNEL, Role::ADMINISTRATOR)) {
            abort(403);
        }

        $query->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('application_date');

        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole(Role::MAO_PERSONNEL, Role::ADMINISTRATOR), 403);

        $data = $request->validate([
            'farmer_profile_id' => ['nullable', 'exists:farmer_profiles,id'],
            'beneficiary_id' => ['nullable', 'exists:beneficiaries,id'],
            'subsidy_type' => ['required', 'string', 'max:150'],
            'application_date' => ['required', 'date'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'distribution_information' => ['nullable', 'string'],
            'remarks' => ['nullable', 'string'],
        ]);

        $data['status'] = 'pending';
        $record = SubsidyRecord::query()->create($data);
        app(AuditLogger::class)->record('Created subsidy application', 'subsidies', $record);

        return response()->json($record->load(['farmer', 'beneficiary']), 201);
    }

    public function show(Request $request, SubsidyRecord $subsidy): JsonResponse
    {
        $this->assertVisible($request, $subsidy);

        return response()->json($subsidy->load(['farmer', 'beneficiary', 'approver']));
    }

    public function updateStatus(Request $request, SubsidyRecord $subsidy): JsonResponse
    {
        abort_unless($request->user()->hasRole(Role::MAO_PERSONNEL, Role::ADMINISTRATOR), 403);

        $data = $request->validate([
            'status' => ['required', Rule::in(SubsidyRecord::STATUSES)],
            'distribution_information' => ['nullable', 'string'],
            'remarks' => ['nullable', 'string'],
        ]);

        $updates = [
            'status' => $data['status'],
            'distribution_information' => $data['distribution_information'] ?? $subsidy->distribution_information,
            'remarks' => $data['remarks'] ?? $subsidy->remarks,
        ];

        if ($data['status'] === 'approved') {
            $updates['approved_by'] = $request->user()->id;
            $updates['approved_at'] = now();
        }
        if ($data['status'] === 'released') {
            $updates['released_at'] = now();
        }

        $subsidy->update($updates);
        app(AuditLogger::class)->record('Updated subsidy status', 'subsidies', $subsidy, ['status' => $data['status']]);

        return response()->json($subsidy);
    }

    private function assertVisible(Request $request, SubsidyRecord $subsidy): void
    {
        $user = $request->user();
        if ($user->hasRole(Role::MAO_PERSONNEL, Role::ADMINISTRATOR)) {
            return;
        }
        if ($user->hasRole(Role::FARMER) && $subsidy->farmer?->user_id === $user->id) {
            return;
        }
        if ($user->hasRole(Role::BENEFICIARY) && $subsidy->beneficiary?->user_id === $user->id) {
            return;
        }
        if ($user->hasRole(Role::TECHNICIAN) && $subsidy->farmer_profile_id) {
            abort_unless(ScopeQuery::farmers($user)->whereKey($subsidy->farmer_profile_id)->exists(), 403);

            return;
        }
        abort(403);
    }
}
