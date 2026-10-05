<?php

namespace App\Http\Controllers;

use App\Models\Beneficiary;
use App\Models\Farm;
use App\Models\FarmerProfile;
use App\Models\ProductionRecord;
use App\Models\SubsidyRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function show(): JsonResponse
    {
        $subsidyByStatus = SubsidyRecord::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $productionByCrop = ProductionRecord::query()
            ->select('crop_type', DB::raw('SUM(quantity) as total_quantity'))
            ->groupBy('crop_type')
            ->orderByDesc('total_quantity')
            ->limit(8)
            ->get();

        $monthExpr = DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', COALESCE(harvest_date, created_at))"
            : "DATE_FORMAT(COALESCE(harvest_date, created_at), '%Y-%m')";

        $productionByMonth = ProductionRecord::query()
            ->select(DB::raw("{$monthExpr} as month"), DB::raw('SUM(quantity) as total_quantity'))
            ->groupBy('month')
            ->orderBy('month')
            ->limit(12)
            ->get();

        $farmersByBarangay = FarmerProfile::query()
            ->select('barangay', DB::raw('COUNT(*) as total'))
            ->where('status', '!=', 'archived')
            ->groupBy('barangay')
            ->orderByDesc('total')
            ->limit(12)
            ->get();

        return response()->json([
            'totals' => [
                'farmers' => FarmerProfile::query()->where('status', '!=', 'archived')->count(),
                'farms' => Farm::query()->where('status', 'active')->count(),
                'beneficiaries' => Beneficiary::query()->count(),
                'subsidies' => SubsidyRecord::query()->count(),
            ],
            'subsidy_by_status' => $subsidyByStatus,
            'production_by_crop' => $productionByCrop,
            'production_trend' => $productionByMonth,
            'farmers_by_barangay' => $farmersByBarangay,
            'farmer_status' => FarmerProfile::query()
                ->select('status', DB::raw('COUNT(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status'),
        ]);
    }
}
