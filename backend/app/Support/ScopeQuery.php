<?php

namespace App\Support;

use App\Models\FarmerProfile;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class ScopeQuery
{
    public static function farmers(User $user): Builder
    {
        $query = FarmerProfile::query();

        if ($user->hasRole(Role::ADMINISTRATOR, Role::MAO_PERSONNEL, Role::RSBSA_FOCAL)) {
            return $query;
        }

        if ($user->hasRole(Role::TECHNICIAN)) {
            return $query->whereHas('technicians', fn ($q) => $q->where('users.id', $user->id));
        }

        if ($user->hasRole(Role::FARMER)) {
            return $query->where('user_id', $user->id);
        }

        return $query->whereRaw('1 = 0');
    }
}
