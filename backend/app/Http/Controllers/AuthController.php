<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->with('role')->where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->isActive()) {
            return response()->json(['message' => 'This account is inactive.'], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('mobile')->plainTextToken;

        // app(AuditLogger::class)->record('Logged in', 'authentication', $user);

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->payload($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();
        app(AuditLogger::class)->record('Logged out', 'authentication');

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('role');

        return response()->json(['user' => $this->payload($user)]);
    }

    private function payload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->status,
            'role' => [
                'id' => $user->role_id,
                'name' => $user->role?->name,
                'slug' => $user->role?->slug,
            ],
            'permissions' => $this->permissions($user->role?->slug),
        ];
    }

    private function permissions(?string $slug): array
    {
        return match ($slug) {
            Role::ADMINISTRATOR => ['users', 'settings', 'audit'],
            Role::MAO_PERSONNEL => ['farmers', 'farms', 'production', 'subsidies', 'beneficiaries', 'dashboard', 'reports', 'duplicates'],
            Role::RSBSA_FOCAL => ['farmers'],
            Role::TECHNICIAN => ['assigned_farmers', 'monitoring'],
            Role::FARMER => ['own_profile', 'own_farms', 'own_subsidies'],
            Role::BENEFICIARY => ['own_beneficiary', 'own_assistance'],
            default => [],
        };
    }
}
