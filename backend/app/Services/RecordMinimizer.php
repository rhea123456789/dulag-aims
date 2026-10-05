<?php

namespace App\Services;

use App\Models\AiReview;
use App\Models\Beneficiary;
use App\Models\Farm;
use App\Models\FarmerProfile;
use App\Models\ProductionRecord;
use App\Models\SubsidyRecord;

class RecordMinimizer
{
    /**
     * Fields sent to Gemini. Contact numbers, emails, street addresses,
     * birth dates, notes, and reference numbers are omitted.
     */
    /**
     * Selected records plus related farm, crop, subsidy, and beneficiary signals.
     * Personal contact details stay out of this packet.
     */
    public function briefing(string $recordType, array $ids): array
    {
        $ids = array_values(array_unique(array_map('intval', $ids)));

        return [
            'office' => 'Municipal Agriculture Office of Dulag, Leyte',
            'selected_type' => $recordType,
            'selected' => $this->forType($recordType, $ids),
            'related' => $this->related($recordType, $ids),
        ];
    }

    public function forType(string $recordType, array $ids): array
    {
        return array_values(array_filter(array_map(
            fn (int $id) => $this->one($recordType, $id),
            $ids
        )));
    }

    public function one(string $recordType, int $id): ?array
    {
        return match ($recordType) {
            'farmer' => $this->farmer(FarmerProfile::query()->with('farms')->find($id)),
            'farm' => $this->farm(Farm::query()->find($id)),
            'beneficiary' => $this->beneficiary(Beneficiary::query()->find($id)),
            'subsidy' => $this->subsidy(SubsidyRecord::query()->find($id)),
            'production' => $this->production(ProductionRecord::query()->with('farm')->find($id)),
            'findings' => $this->finding(AiReview::query()->find($id)),
            default => null,
        };
    }

    private function related(string $recordType, array $ids): array
    {
        $related = [
            'farmers' => [],
            'farms' => [],
            'production' => [],
            'subsidies' => [],
            'beneficiaries' => [],
        ];

        if ($recordType === 'farmer') {
            $farmers = FarmerProfile::query()->with(['farms.productions', 'subsidies'])->whereIn('id', $ids)->get();
            foreach ($farmers as $farmer) {
                foreach ($farmer->farms as $farm) {
                    $related['farms'][] = $this->farm($farm);
                    foreach ($farm->productions as $production) {
                        $related['production'][] = $this->production($production);
                    }
                }
                foreach ($farmer->subsidies as $subsidy) {
                    $related['subsidies'][] = $this->subsidy($subsidy);
                }
            }
            $related['beneficiaries'] = $this->beneficiariesForFarmers($ids);
        }

        if ($recordType === 'farm') {
            $farms = Farm::query()->with(['farmer', 'productions'])->whereIn('id', $ids)->get();
            foreach ($farms as $farm) {
                if ($farm->farmer) {
                    $related['farmers'][] = $this->farmer($farm->farmer);
                }
                foreach ($farm->productions as $production) {
                    $related['production'][] = $this->production($production);
                }
            }
        }

        if ($recordType === 'production') {
            $records = ProductionRecord::query()->with('farm.farmer')->whereIn('id', $ids)->get();
            foreach ($records as $record) {
                if ($record->farm) {
                    $related['farms'][] = $this->farm($record->farm);
                    if ($record->farm->farmer) {
                        $related['farmers'][] = $this->farmer($record->farm->farmer);
                    }
                }
            }
        }

        if ($recordType === 'subsidy') {
            $subsidies = SubsidyRecord::query()->with('farmer')->whereIn('id', $ids)->get();
            foreach ($subsidies as $subsidy) {
                if ($subsidy->farmer) {
                    $related['farmers'][] = $this->farmer($subsidy->farmer);
                }
            }
        }

        if ($recordType === 'beneficiary') {
            $people = Beneficiary::query()->with('subsidies')->whereIn('id', $ids)->get();
            foreach ($people as $person) {
                foreach ($person->subsidies as $subsidy) {
                    $related['subsidies'][] = $this->subsidy($subsidy);
                }
            }
        }

        return array_map(
            fn (array $rows) => array_values(array_filter($rows)),
            $related
        );
    }

    private function beneficiariesForFarmers(array $farmerIds): array
    {
        return Beneficiary::query()
            ->whereIn('farmer_profile_id', $farmerIds)
            ->get()
            ->map(fn (Beneficiary $beneficiary) => $this->beneficiary($beneficiary))
            ->filter()
            ->values()
            ->all();
    }

    private function farmer(?FarmerProfile $farmer): ?array
    {
        if (! $farmer) {
            return null;
        }

        $area = $farmer->farms->sum(fn (Farm $farm) => (float) $farm->area_hectares);

        return [
            'kind' => 'farmer',
            'given_initial' => substr((string) $farmer->first_name, 0, 1),
            'last_name_length' => strlen((string) $farmer->last_name),
            'barangay' => $farmer->barangay,
            'municipality' => $farmer->municipality,
            'status' => $farmer->status,
            'has_rsbsa_reference' => (bool) $farmer->rsbsa_reference_number,
            'has_contact' => (bool) $farmer->contact_number,
            'farm_count' => $farmer->farms->count(),
            'area_band_hectares' => round($area, 1),
        ];
    }

    private function farm(?Farm $farm): ?array
    {
        if (! $farm) {
            return null;
        }

        return [
            'kind' => 'farm',
            'barangay' => $farm->barangay,
            'area_band_hectares' => round((float) $farm->area_hectares, 1),
            'classification' => $farm->land_classification,
            'has_location' => $farm->location !== '',
            'status' => $farm->status,
        ];
    }

    private function beneficiary(?Beneficiary $beneficiary): ?array
    {
        if (! $beneficiary) {
            return null;
        }

        return [
            'kind' => 'beneficiary',
            'given_initial' => substr((string) $beneficiary->first_name, 0, 1),
            'last_name_length' => strlen((string) $beneficiary->last_name),
            'barangay' => $beneficiary->barangay,
            'assistance_status' => $beneficiary->subsidy_status,
            'has_contact' => (bool) $beneficiary->contact_number,
            'linked_to_farmer' => (bool) $beneficiary->farmer_profile_id,
        ];
    }

    private function subsidy(?SubsidyRecord $subsidy): ?array
    {
        if (! $subsidy) {
            return null;
        }

        return [
            'kind' => 'subsidy',
            'subsidy_type' => $subsidy->subsidy_type,
            'status' => $subsidy->status,
            'application_month' => optional($subsidy->application_date)->format('Y-m'),
            'has_amount' => $subsidy->amount !== null,
            'linked_to_farmer' => (bool) $subsidy->farmer_profile_id,
            'linked_to_beneficiary' => (bool) $subsidy->beneficiary_id,
        ];
    }

    private function production(?ProductionRecord $record): ?array
    {
        if (! $record) {
            return null;
        }

        return [
            'kind' => 'production',
            'crop_type' => $record->crop_type,
            'season' => $record->season,
            'quantity_band' => $record->quantity !== null ? round((float) $record->quantity, 1) : null,
            'unit' => $record->unit,
            'barangay' => $record->farm?->barangay,
        ];
    }

    private function finding(?AiReview $review): ?array
    {
        if (! $review) {
            return null;
        }

        return [
            'kind' => 'finding',
            'record_type' => $review->record_type,
            'finding' => $review->ai_result['finding'] ?? null,
            'status' => $review->status,
            'confidence' => $review->confidence,
        ];
    }
}
