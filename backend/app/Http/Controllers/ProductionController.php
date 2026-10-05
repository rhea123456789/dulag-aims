<?php

namespace App\Http\Controllers;

use App\Models\Farm;
use App\Models\ProductionRecord;
use App\Models\ProfitRecord;
use App\Models\Role;
use App\Services\AuditLogger;
use App\Support\ScopeQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $farmerIds = ScopeQuery::farmers($request->user())->pluck('id');

        $records = ProductionRecord::query()
            ->with(['farm.farmer', 'profit'])
            ->whereHas('farm', fn ($q) => $q->whereIn('farmer_profile_id', $farmerIds))
            ->when($request->crop_type, fn ($q, $c) => $q->where('crop_type', $c))
            ->when($request->season, fn ($q, $s) => $q->where('season', $s))
            ->orderByDesc('harvest_date')
            ->paginate(20);

        return response()->json($records);
    }

    public function summaries(Request $request): JsonResponse
    {
        $farmerIds = ScopeQuery::farmers($request->user())->pluck('id');

        $byCrop = ProductionRecord::query()
            ->select('crop_type', DB::raw('COUNT(*) as records'), DB::raw('SUM(quantity) as total_quantity'))
            ->whereHas('farm', fn ($q) => $q->whereIn('farmer_profile_id', $farmerIds))
            ->groupBy('crop_type')
            ->get();

        $bySeason = ProductionRecord::query()
            ->select('season', DB::raw('COUNT(*) as records'), DB::raw('SUM(quantity) as total_quantity'))
            ->whereHas('farm', fn ($q) => $q->whereIn('farmer_profile_id', $farmerIds))
            ->groupBy('season')
            ->get();

        return response()->json([
            'by_crop' => $byCrop,
            'by_season' => $bySeason,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole(Role::MAO_PERSONNEL, Role::TECHNICIAN, Role::ADMINISTRATOR), 403);
        $data = $request->validate([
            'farm_id' => ['required', 'exists:farms,id'],
            'crop_type' => ['required', 'string', 'max:100'],
            'planting_date' => ['nullable', 'date'],
            'harvest_date' => ['nullable', 'date', 'after_or_equal:planting_date'],
            'quantity' => ['nullable', 'numeric', 'min:0'],
            'unit' => ['nullable', 'string', 'max:20'],
            'yield_per_hectare' => ['nullable', 'numeric', 'min:0'],
            'season' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
            'expenses' => ['nullable', 'numeric', 'min:0'],
            'income' => ['nullable', 'numeric', 'min:0'],
        ]);

        $farm = Farm::query()->findOrFail($data['farm_id']);
        abort_unless(ScopeQuery::farmers($request->user())->whereKey($farm->farmer_profile_id)->exists(), 403);

        $record = ProductionRecord::query()->create([
            ...collect($data)->except(['expenses', 'income'])->all(),
            'recorded_by' => $request->user()->id,
        ]);

        if ($request->filled('expenses') || $request->filled('income')) {
            $income = (float) ($data['income'] ?? 0);
            $expenses = (float) ($data['expenses'] ?? 0);
            ProfitRecord::query()->create([
                'production_record_id' => $record->id,
                'expenses' => $expenses,
                'income' => $income,
                'profit' => ProfitRecord::computeProfit($income, $expenses),
            ]);
        }

        app(AuditLogger::class)->record('Recorded production', 'production', $record);

        return response()->json($record->load(['farm', 'profit']), 201);
    }

    public function show(Request $request, ProductionRecord $production): JsonResponse
    {
        abort_unless(ScopeQuery::farmers($request->user())->whereKey($production->farm->farmer_profile_id)->exists(), 403);

        return response()->json($production->load(['farm.farmer', 'profit']));
    }
}
