<?php

namespace App\Http\Controllers;

use App\Models\FarmerProfile;
use App\Models\Role;
use App\Services\AuditLogger;
use App\Services\DuplicateDetectionService;
use App\Support\ScopeQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FarmerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ScopeQuery::farmers($request->user())
            ->with(['user', 'technicians'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('contact_number', 'like', "%{$search}%")
                        ->orWhere('rsbsa_reference_number', 'like', "%{$search}%")
                        ->orWhere('barangay', 'like', "%{$search}%");
                });
            })
            ->when($request->barangay, fn ($q, $b) => $q->where('barangay', $b))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->orderBy('last_name');

        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeWrite($request);
        $payload = $this->validated($request);
        $technicianIds = $payload['technician_ids'] ?? null;
        unset($payload['technician_ids']);
        $farmer = FarmerProfile::query()->create($payload);
        if (is_array($technicianIds)) {
            $farmer->technicians()->sync($technicianIds);
        }

        app(AuditLogger::class)->record('Created farmer profile', 'farmers', $farmer, $farmer->only(['first_name', 'last_name', 'rsbsa_reference_number']));
        app(DuplicateDetectionService::class)->scanFarmers($farmer);

        return response()->json($farmer->load(['user', 'technicians']), 201);
    }

    public function show(Request $request, FarmerProfile $farmer): JsonResponse
    {
        $this->assertVisible($request, $farmer);

        return response()->json($farmer->load(['user', 'technicians', 'farms', 'subsidies']));
    }

    public function update(Request $request, FarmerProfile $farmer): JsonResponse
    {
        $this->assertVisible($request, $farmer);

        if ($request->user()->hasRole(Role::FARMER)) {
            $data = $request->validate([
                'contact_number' => ['nullable', 'string', 'max:30'],
                'street' => ['nullable', 'string', 'max:255'],
                'notes' => ['nullable', 'string'],
            ]);
            $before = $farmer->only(array_keys($data));
            $farmer->update($data);
            app(AuditLogger::class)->record('Updated own farmer profile', 'farmers', $farmer, [
                'before' => $before,
                'after' => $farmer->only(array_keys($data)),
            ]);

            return response()->json($farmer);
        }

        $this->authorizeWrite($request);

        $before = $farmer->toArray();
        $payload = $this->validated($request, $farmer->id);
        $technicianIds = $payload['technician_ids'] ?? null;
        unset($payload['technician_ids']);
        $farmer->update($payload);
        if (is_array($technicianIds)) {
            $farmer->technicians()->sync($technicianIds);
        }

        app(AuditLogger::class)->record('Updated farmer profile', 'farmers', $farmer, [
            'before' => $before,
            'after' => $farmer->fresh()->toArray(),
        ]);
        app(DuplicateDetectionService::class)->scanFarmers($farmer);

        return response()->json($farmer->load(['user', 'technicians']));
    }

    public function archive(Request $request, FarmerProfile $farmer): JsonResponse
    {
        $this->authorizeWrite($request);
        $farmer->update([
            'status' => 'archived',
            'archived_at' => now(),
        ]);
        app(AuditLogger::class)->record('Archived farmer profile', 'farmers', $farmer);

        return response()->json($farmer);
    }

    public function verify(Request $request, FarmerProfile $farmer): JsonResponse
    {
        abort_unless($request->user()->hasRole(Role::RSBSA_FOCAL, Role::MAO_PERSONNEL, Role::ADMINISTRATOR), 403);

        $farmer->update([
            'status' => 'verified',
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);
        app(AuditLogger::class)->record('Verified farmer data', 'farmers', $farmer);

        return response()->json($farmer);
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'birthdate' => ['nullable', 'date'],
            'sex' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'civil_status' => ['nullable', 'string', 'max:50'],
            'contact_number' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'street' => ['nullable', 'string', 'max:255'],
            'barangay' => ['required', 'string', 'max:100'],
            'municipality' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'ownership_information' => ['nullable', 'string', 'max:255'],
            'rsbsa_reference_number' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['pending_verification', 'verified', 'active', 'archived'])],
            'notes' => ['nullable', 'string'],
            'technician_ids' => ['nullable', 'array'],
            'technician_ids.*' => ['integer', 'exists:users,id'],
        ]);
    }

    private function syncAssignments(Request $request, FarmerProfile $farmer): void
    {
        if ($request->has('technician_ids')) {
            $farmer->technicians()->sync($request->input('technician_ids', []));
        }
    }

    private function authorizeWrite(Request $request): void
    {
        abort_unless($request->user()->hasRole(
            Role::ADMINISTRATOR,
            Role::MAO_PERSONNEL,
            Role::RSBSA_FOCAL,
            Role::TECHNICIAN
        ), 403);
    }

    private function assertVisible(Request $request, FarmerProfile $farmer): void
    {
        $allowed = ScopeQuery::farmers($request->user())->whereKey($farmer->id)->exists();
        abort_unless($allowed, 403);
    }
}
