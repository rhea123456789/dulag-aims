<?php

namespace App\Http\Controllers;

use App\Models\Beneficiary;
use App\Models\FarmerProfile;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RegisterController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:farmer,beneficiary'],
            'full_name' => ['required', 'string', 'max:255', 'regex:/^\s*\S+(?:\s+\S+)+\s*$/'],
            'contact_number' => ['required', 'string', 'max:30', 'regex:/^[0-9+\-\s()]{7,30}$/'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email'), Rule::unique('farmer_profiles', 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'address' => ['required', 'string', 'max:255'],
            'barangay' => ['required', 'string', 'max:255'],
            'rsbsa_reference_number' => ['required_if:type,farmer', 'nullable', 'string', 'max:255'],
            'farm_information' => ['required_if:type,farmer', 'nullable', 'string', 'max:2000'],
            'beneficiary_details' => ['required_if:type,beneficiary', 'nullable', 'string', 'max:2000'],
        ], [
            'full_name.regex' => 'Enter your first and last name.',
            'contact_number.regex' => 'Enter a valid contact number.',
        ]);

        $slug = $data['type'] === 'farmer' ? Role::FARMER : Role::BENEFICIARY;
        $role = Role::query()->where('slug', $slug)->firstOrFail();
        [$firstName, $lastName] = $this->splitName($data['full_name']);

        $user = DB::transaction(function () use ($data, $role, $firstName, $lastName) {
            $user = User::query()->create([
                'name' => trim($data['full_name']),
                'email' => $data['email'],
                'password' => $data['password'],
                'role_id' => $role->id,
                'status' => 'active',
            ]);

            if ($data['type'] === 'farmer') {
                FarmerProfile::query()->create([
                    'user_id' => $user->id,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'contact_number' => $data['contact_number'],
                    'email' => $data['email'],
                    'street' => $data['address'],
                    'barangay' => $data['barangay'],
                    'municipality' => 'Dulag',
                    'province' => 'Leyte',
                    'rsbsa_reference_number' => $data['rsbsa_reference_number'],
                    'notes' => $data['farm_information'],
                    'status' => 'pending_verification',
                ]);
            } else {
                Beneficiary::query()->create([
                    'user_id' => $user->id,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'contact_number' => $data['contact_number'],
                    'barangay' => $data['barangay'],
                    'address' => $data['address'],
                    'subsidy_status' => 'none',
                    'notes' => $data['beneficiary_details'],
                ]);
            }

            return $user;
        });

        app(AuditLogger::class)->record('Registered', 'authentication', $user, [
            'role' => $slug,
        ]);

        $message = $data['type'] === 'farmer'
            ? 'Your farmer account has been created. You can sign in now. Your profile stays pending until the Municipal Agriculture Office verifies it.'
            : 'Your beneficiary account has been created. You can sign in now.';

        return response()->json([
            'message' => $message,
            'role' => $slug,
        ], 201);
    }

    private function splitName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName)) ?: [];
        $lastName = (string) array_pop($parts);
        $firstName = $parts === [] ? $lastName : implode(' ', $parts);

        return [$firstName, $lastName];
    }
}
