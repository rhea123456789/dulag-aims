<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    public const ADMINISTRATOR = 'system_administrator';
    public const MAO_PERSONNEL = 'mao_personnel';
    public const TECHNICIAN = 'agricultural_technician';
    public const RSBSA_FOCAL = 'rsbsa_focal_person';
    public const FARMER = 'farmer';
    public const BENEFICIARY = 'beneficiary';

    protected $fillable = ['name', 'slug', 'description'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
