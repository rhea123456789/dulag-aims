<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Roles required by the application, plus one local development administrator.
     * Existing rows are left unchanged. No farmer or beneficiary records are created.
     */
    public function run(): void
    {
        $roles = [
            [Role::ADMINISTRATOR, 'System Administrator', 'Users, roles, settings, and audit logs'],
            [Role::MAO_PERSONNEL, 'MAO Personnel', 'Agricultural records, dashboards, and duplicate review'],
            [Role::RSBSA_FOCAL, 'RSBSA Focal Person', 'Farmer registration and validation'],
            [Role::TECHNICIAN, 'Agricultural Technician', 'Assigned farmers and field submissions'],
            [Role::FARMER, 'Farmer', 'Own profile, farms, and subsidy status'],
            [Role::BENEFICIARY, 'Beneficiary', 'Own profile and assistance status'],
        ];

        foreach ($roles as [$slug, $name, $description]) {
            Role::query()->firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'description' => $description]
            );
        }

        $administrator = Role::query()->where('slug', Role::ADMINISTRATOR)->firstOrFail();

        User::query()->firstOrCreate(
            ['email' => 'admin@dulag-faims.test'],
            [
                'name' => 'System Administrator',
                'password' => 'DulagFaims-local',
                'role_id' => $administrator->id,
                'status' => 'active',
            ]
        );
    }
}
