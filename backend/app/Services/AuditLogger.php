<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditLogger
{
    public function record(string $action, string $module, ?Model $record = null, ?array $changes = null): AuditLog
    {
        return AuditLog::query()->create([
            'user_id' => Auth::id(),
            'action' => $action,
            'module' => $module,
            'record_type' => $record ? $record::class : null,
            'record_id' => $record?->getKey(),
            'changes' => $changes,
            'ip_address' => request()?->ip(),
        ]);
    }
}
