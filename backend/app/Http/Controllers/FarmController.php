<?php

namespace App\Http\Controllers;

use App\Models\Farm;
use App\Models\Role;
use App\Services\AuditLogger;
use App\Services\DuplicateDetectionService;
use App\Support\ScopeQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FarmController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $farmerIds = ScopeQuery::farmers($request->user())->pluck('id');

        $farms = Farm::query()
            ->with('farmer')
            ->whereIn('farmer_profile_id', $farmerIds)
            ->when($request->search, function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('location', 'like', "%{$search}%")
                        ->orWhere('barangay', 'like', "%{$search}%")
                        ->orWhere('parcel_name', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($farms);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeWrite($request);
        $data = $this->validated($request);
        $this->assertFarmerVisible($request, $data['farmer_profile_id']);

        $farm = Farm::query()->create($data);
        $farm->history()->create([
            'changed_by' => $request->user()->id,
            'changes' => ['created' => $farm->toArray()],
        ]);
        app(AuditLogger::class)->record('Created farm/landholding', 'farms', $farm);
        app(DuplicateDetectionService::class)->scanFarms($farm);

        return response()->json($farm->load('farmer'), 201);
    }

    public function show(Request $request, Farm $farm): JsonResponse
    {
        $this->assertFarmerVisible($request, $farm->farmer_profile_id);

        return response()->json($farm->load(['farmer', 'productions.profit', 'history.actor']));
    }

    public function update(Request $request, Farm $farm): JsonResponse
    {
        $this->authorizeWrite($request);
        $this->assertFarmerVisible($request, $farm->farmer_profile_id);

        $before = $farm->toArray();
        $farm->update($this->validated($request, $farm->id));
        $farm->history()->create([
            'changed_by' => $request->user()->id,
            'changes' => ['before' => $before, 'after' => $farm->fresh()->toArray()],
        ]);
        app(AuditLogger::class)->record('Updated farm record', 'farms', $farm);
        app(DuplicateDetectionService::class)->scanFarms($farm);

        return response()->json($farm->load('farmer'));
    }

    private function validated(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'farmer_profile_id' => ['required', 'exists:farmer_profiles,id'],
            'parcel_name' => ['nullable', 'string', 'max:150'],
            'location' => ['required', 'string', 'max:255'],
            'barangay' => ['required', 'string', 'max:100'],
            'area_hectares' => ['required', 'numeric', 'min:0'],
            'land_classification' => ['nullable', 'string', 'max:100'],
            'ownership_arrangement' => ['nullable', 'string', 'max:150'],
            'cultivation_details' => ['nullable', 'string'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'archived'])],
        ]);
    }

    private function authorizeWrite(Request $request): void
    {
        abort_unless($request->user()->hasRole(Role::MAO_PERSONNEL, Role::TECHNICIAN, Role::ADMINISTRATOR), 403);
    }

    private function assertFarmerVisible(Request $request, int $farmerId): void
    {
        abort_unless(ScopeQuery::farmers($request->user())->whereKey($farmerId)->exists(), 403);
    }
}
