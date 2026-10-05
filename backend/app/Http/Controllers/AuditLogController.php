<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = AuditLog::query()
            ->with('user:id,name,email')
            ->when($request->module, fn ($q, $m) => $q->where('module', $m))
            ->when($request->search, function ($q, $search) {
                $q->where('action', 'like', "%{$search}%");
            })
            ->orderByDesc('id')
            ->paginate(30);

        return response()->json($logs);
    }
}
