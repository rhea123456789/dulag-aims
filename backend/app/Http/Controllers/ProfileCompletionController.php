<?php

namespace App\Http\Controllers;

use App\Models\Beneficiary;
use App\Models\Farm;
use App\Models\FarmerProfile;
use App\Models\ProductionRecord;
use App\Models\Role;
use App\Services\AuditLogger;
use App\Services\DuplicateDetectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProfileCompletionController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $this->profile($user);
        $farm = $profile instanceof FarmerProfile ? $profile->farms()->with('productions')->first() : null;

        return response()->json([
            'role' => $user->role?->slug,
            'completed' => $profile->profile_completed_at !== null,
            'profile' => $profile,
            'farm' => $farm,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $this->profile($user);
        $data = $request->validate([
            'step' => ['required', Rule::in([1, 2])],
        ]);

        if ((int) $data['step'] === 1) {
            $saved = $this->savePersonal($request, $user, $profile);
        } else {
            $saved = $this->saveFarm($request, $user, $profile);
        }

        return response()->json([
            'message' => (int) $data['step'] === 2
                ? 'Your information has been saved successfully.'
                : 'Personal information saved.',
            'completed' => $saved->profile_completed_at !== null,
            'profile' => $saved->fresh(),
        ]);
    }

    private function profile($user): FarmerProfile|Beneficiary
    {
        if ($user->hasRole(Role::FARMER)) {
            $profile = FarmerProfile::query()->where('user_id', $user->id)->first();
            abort_unless($profile, 404, 'Farmer profile was not found.');

            return $profile;
        }

        if ($user->hasRole(Role::BENEFICIARY)) {
            $profile = Beneficiary::query()->where('user_id', $user->id)->first();
            abort_unless($profile, 404, 'Beneficiary profile was not found.');

            return $profile;
        }

        abort(403, 'Profile completion is for farmer and beneficiary accounts.');
    }

    private function savePersonal(Request $request, $user, FarmerProfile|Beneficiary $profile): FarmerProfile|Beneficiary
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'sex' => ['required', Rule::in(['male', 'female', 'other'])],
            'birthdate' => ['required', 'date', 'before:today'],
            'place_of_birth' => ['required', 'string', 'max:150'],
            'civil_status' => ['required', Rule::in(['Single', 'Married', 'Widowed', 'Separated', 'Annulled'])],
            'street' => ['required', 'string', 'max:150'],
            'sitio' => ['nullable', 'string', 'max:150'],
            'barangay' => ['required', 'string', 'max:100'],
            'municipality' => ['required', 'string', 'max:100'],
            'province' => ['required', 'string', 'max:100'],
            'region' => ['required', 'string', 'max:100'],
            'education_level' => ['required', 'string', 'max:100'],
            'livelihood_type' => ['required', Rule::in(['farmer', 'farm_worker', 'fisher', 'agri_youth'])],
        ]);

        $profile->fill($data);
        if ($profile instanceof Beneficiary) {
            $profile->address = collect([$data['street'], $data['sitio'] ?? null])->filter()->implode(', ');
        }
        $profile->save();

        $user->update([
            'name' => trim(collect([$data['first_name'], $data['middle_name'] ?? null, $data['last_name'], $data['suffix'] ?? null])->filter()->implode(' ')),
        ]);

        app(AuditLogger::class)->record('Updated profile personal information', 'profile', $profile);

        return $profile;
    }

    private function saveFarm(Request $request, $user, FarmerProfile|Beneficiary $profile): FarmerProfile|Beneficiary
    {
        $needsFarm = $profile instanceof FarmerProfile && $profile->livelihood_type === 'farmer';

        $rules = [
            'association_name' => ['nullable', 'string', 'max:150'],
            'assistance' => ['nullable', 'string', 'max:2000'],
        ];

        if ($profile instanceof FarmerProfile) {
            $rules['rsbsa_reference_number'] = ['nullable', 'string', 'max:255'];
        }

        if ($needsFarm) {
            $rules = array_merge($rules, [
                'farm_location' => ['required', 'string', 'max:255'],
                'farm_barangay' => ['required', 'string', 'max:100'],
                'total_area' => ['required', 'numeric', 'min:0.0001'],
                'area_unit' => ['required', Rule::in(['hectare', 'square_meter'])],
                'tenure' => ['required', Rule::in(['registered_owner', 'lessee', 'tenant', 'steward'])],
                'land_owner_name' => ['required_unless:tenure,registered_owner', 'nullable', 'string', 'max:150'],
                'crop_type' => ['required', 'string', 'max:100'],
                'area_used' => ['nullable', 'numeric', 'min:0'],
                'cropping_notes' => ['nullable', 'string', 'max:2000'],
            ]);
        }

        $data = $request->validate($rules);

        DB::transaction(function () use ($data, $needsFarm, $profile, $user) {
            $profile->association_name = $data['association_name'] ?? null;
            if ($profile instanceof FarmerProfile) {
                $profile->rsbsa_reference_number = $data['rsbsa_reference_number'] ?? $profile->rsbsa_reference_number;
                if (! empty($data['assistance'])) {
                    $profile->notes = $data['assistance'];
                }
            } else {
                $profile->notes = $data['assistance'] ?? $profile->notes;
            }

            if ($needsFarm && $profile instanceof FarmerProfile) {
                $hectares = $data['area_unit'] === 'square_meter'
                    ? round(((float) $data['total_area']) / 10000, 4)
                    : $data['total_area'];
                $tenure = [
                    'registered_owner' => 'Registered owner',
                    'lessee' => 'Lessee',
                    'tenant' => 'Tenant',
                    'steward' => 'Steward',
                ][$data['tenure']];
                $details = trim(collect([
                    isset($data['area_used']) && $data['area_used'] !== '' ? 'Area used: '.$data['area_used'].' '.$data['area_unit'] : null,
                    $data['cropping_notes'] ?? null,
                ])->filter()->implode('. '));

                $farm = $profile->farms()->first() ?? new Farm(['farmer_profile_id' => $profile->id]);
                $created = ! $farm->exists;
                $farm->fill([
                    'parcel_name' => $farm->parcel_name ?: 'Primary farm',
                    'location' => $data['farm_location'],
                    'barangay' => $data['farm_barangay'],
                    'area_hectares' => $hectares,
                    'ownership_arrangement' => $tenure,
                    'land_owner_name' => $data['tenure'] === 'registered_owner' ? null : ($data['land_owner_name'] ?? null),
                    'cultivation_details' => $details ?: null,
                    'status' => 'active',
                ]);
                $farm->save();
                if ($created) {
                    $farm->history()->create([
                        'changed_by' => $user->id,
                        'changes' => ['created' => $farm->toArray()],
                    ]);
                    app(DuplicateDetectionService::class)->scanFarms($farm);
                }

                $production = $farm->productions()->first() ?? new ProductionRecord(['farm_id' => $farm->id]);
                $production->fill([
                    'crop_type' => $data['crop_type'],
                    'notes' => $details ?: null,
                    'recorded_by' => $user->id,
                ]);
                $production->save();
            }

            $profile->profile_completed_at = now();
            $profile->save();
        });

        app(AuditLogger::class)->record('Completed agricultural profile', 'profile', $profile->fresh());

        return $profile->fresh();
    }
}
