<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Beneficiary;
use App\Models\DuplicateReview;
use App\Models\Farm;
use App\Models\FarmerProfile;
use App\Models\ProductionRecord;
use App\Models\SubsidyRecord;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class ReportController extends Controller
{
    public function export(Request $request, string $type): Response
    {
        $format = $request->query('format', 'xlsx');
        abort_unless(in_array($type, ['farmers', 'farms', 'production', 'subsidies', 'beneficiaries', 'duplicates'], true), 404);
        abort_unless(in_array($format, ['pdf', 'xlsx', 'excel'], true), 422);

        [$title, $headings, $rows] = $this->dataset($type);

        if (in_array($format, ['xlsx', 'excel'], true)) {
            return Excel::download(new class($headings, $rows) implements FromArray, WithHeadings
            {
                public function __construct(private array $headings, private array $rows) {}

                public function headings(): array
                {
                    return $this->headings;
                }

                public function array(): array
                {
                    return $this->rows;
                }
            }, "{$type}-report.xlsx");
        }

        $pdf = Pdf::loadView('reports.table', compact('title', 'headings', 'rows'));

        return $pdf->download("{$type}-report.pdf");
    }

    private function dataset(string $type): array
    {
        return match ($type) {
            'farmers' => [
                'Farmer Report — MAO Dulag, Leyte',
                ['ID', 'Name', 'Barangay', 'Contact', 'RSBSA Reference', 'Status'],
                FarmerProfile::query()->orderBy('last_name')->get()->map(fn ($f) => [
                    $f->id, $f->fullName(), $f->barangay, $f->contact_number, $f->rsbsa_reference_number, $f->status,
                ])->all(),
            ],
            'farms' => [
                'Farm Report — MAO Dulag, Leyte',
                ['ID', 'Farmer', 'Barangay', 'Location', 'Area (ha)', 'Classification'],
                Farm::query()->with('farmer')->orderBy('id')->get()->map(fn ($farm) => [
                    $farm->id, $farm->farmer?->fullName(), $farm->barangay, $farm->location, $farm->area_hectares, $farm->land_classification,
                ])->all(),
            ],
            'production' => [
                'Production Report — MAO Dulag, Leyte',
                ['ID', 'Farm', 'Crop', 'Season', 'Quantity', 'Harvest Date'],
                ProductionRecord::query()->with('farm')->orderByDesc('id')->get()->map(fn ($p) => [
                    $p->id, $p->farm?->parcel_name, $p->crop_type, $p->season, $p->quantity, optional($p->harvest_date)?->toDateString(),
                ])->all(),
            ],
            'subsidies' => [
                'Subsidy Report — MAO Dulag, Leyte',
                ['ID', 'Type', 'Applicant Farmer', 'Status', 'Amount', 'Application Date'],
                SubsidyRecord::query()->with('farmer')->orderByDesc('id')->get()->map(fn ($s) => [
                    $s->id, $s->subsidy_type, $s->farmer?->fullName(), $s->status, $s->amount, optional($s->application_date)?->toDateString(),
                ])->all(),
            ],
            'beneficiaries' => [
                'Beneficiary Report — MAO Dulag, Leyte',
                ['ID', 'Name', 'Barangay', 'Subsidy Status'],
                Beneficiary::query()->orderBy('last_name')->get()->map(fn ($b) => [
                    $b->id, $b->fullName(), $b->barangay, $b->subsidy_status,
                ])->all(),
            ],
            'duplicates' => [
                'Duplicate Review Report — MAO Dulag, Leyte',
                ['ID', 'Method', 'Hits', 'Status', 'Final Action', 'Summary'],
                DuplicateReview::query()->orderByDesc('id')->get()->map(fn ($d) => [
                    $d->id, $d->detection_method, implode(', ', $d->rule_hits ?? []), $d->review_status, $d->final_action, $d->gemini_summary,
                ])->all(),
            ],
        };
    }
}
