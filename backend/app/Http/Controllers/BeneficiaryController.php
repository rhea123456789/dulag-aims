<?php

namespace App\Http\Controllers;

use App\Models\AssistanceRecord;
use App\Models\Beneficiary;
use App\Models\Role;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BeneficiaryController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        $beneficiary = Beneficiary::query()
            ->with(['assistance', 'subsidies'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return response()->json($beneficiary);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Beneficiary::query()->with(['farmer', 'assistance']);

        if ($user->hasRole(Role::BENEFICIARY)) {
            $query->where('user_id', $user->id);
        } elseif (! $user->hasRole(Role::MAO_PERSONNEL, Role::ADMINISTRATOR)) {
            abort(403);
        }

        $query->when($request->search, function ($q, $search) {
            $q->where(function ($inner) use ($search) {
                $inner->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('barangay', 'like', "%{$search}%");
            });
        });

        return response()->json($query->orderBy('last_name')->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole(Role::MAO_PERSONNEL, Role::ADMINISTRATOR), 403);

        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'farmer_profile_id' => ['nullable', 'exists:farmer_profiles,id'],
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'contact_number' => ['nullable', 'string', 'max:30'],
            'barangay' => ['required', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:255'],
            'subsidy_status' => ['nullable', 'in:none,pending,active,completed'],
            'notes' => ['nullable', 'string'],
        ]);

        $beneficiary = Beneficiary::query()->create($data);
        app(AuditLogger::class)->record('Registered beneficiary', 'beneficiaries', $beneficiary);

        return response()->json($beneficiary, 201);
    }

    public function show(Request $request, Beneficiary $beneficiary): JsonResponse
    {
        $user = $request->user();
        if ($user->hasRole(Role::BENEFICIARY)) {
            abort_unless($beneficiary->user_id === $user->id, 403);
        } elseif (! $user->hasRole(Role::MAO_PERSONNEL, Role::ADMINISTRATOR)) {
            abort(403);
        }

        return response()->json($beneficiary->load(['farmer', 'assistance', 'subsidies']));
    }

    public function addAssistance(Request $request, Beneficiary $beneficiary): JsonResponse
    {
        abort_unless($request->user()->hasRole(Role::MAO_PERSONNEL, Role::ADMINISTRATOR), 403);

        $data = $request->validate([
            'subsidy_record_id' => ['nullable', 'exists:subsidy_records,id'],
            'assistance_type' => ['required', 'string', 'max:150'],
            'date_received' => ['required', 'date'],
            'description' => ['nullable', 'string'],
            'quantity_or_amount' => ['nullable', 'numeric', 'min:0'],
            'unit' => ['nullable', 'string', 'max:30'],
        ]);

        $record = $beneficiary->assistance()->create($data);
        $beneficiary->update(['subsidy_status' => 'active']);
        app(AuditLogger::class)->record('Recorded assistance', 'beneficiaries', $record);

        return response()->json($record, 201);
    }
}
