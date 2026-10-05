<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->with('role')
            ->when($request->search, function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(20);

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role_id' => ['required', 'exists:roles,id'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $user = User::query()->create($data);
        app(AuditLogger::class)->record('Created user', 'users', $user, ['email' => $user->email, 'role_id' => $user->role_id]);

        return response()->json($user->load('role'), 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role_id' => ['sometimes', 'exists:roles,id'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);
        app(AuditLogger::class)->record('Updated user', 'users', $user, $data);

        return response()->json($user->load('role'));
    }

    public function roles(): JsonResponse
    {
        return response()->json(Role::query()->orderBy('name')->get());
    }

    public function settings(): JsonResponse
    {
        return response()->json(SystemSetting::query()->orderBy('key')->get());
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['nullable', 'string'],
        ]);

        foreach ($data['settings'] as $row) {
            SystemSetting::query()->updateOrCreate(['key' => $row['key']], ['value' => $row['value'] ?? '']);
        }

        app(AuditLogger::class)->record('Updated system settings', 'settings', null, $data);

        return response()->json(SystemSetting::query()->orderBy('key')->get());
    }
}
