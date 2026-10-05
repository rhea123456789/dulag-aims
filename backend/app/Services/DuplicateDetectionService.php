<?php

namespace App\Services;

use App\Models\Beneficiary;
use App\Models\DuplicateReview;
use App\Models\Farm;
use App\Models\FarmerProfile;
use App\Models\SubsidyRecord;

class DuplicateDetectionService
{
    /**
     * Rule-based flags only. Never merges, deletes, approves, or rejects records.
     *
     * @return array{farmer_flags_created: int, farm_flags_created: int, beneficiary_flags_created: int, subsidy_flags_created: int, incomplete_flags_created: int}
     */
    public function scanAll(): array
    {
        return [
            'farmer_flags_created' => $this->scanFarmers(),
            'farm_flags_created' => $this->scanFarms(),
            'beneficiary_flags_created' => $this->scanBeneficiaries(),
            'subsidy_flags_created' => $this->scanSubsidies(),
            'incomplete_flags_created' => $this->scanIncomplete(),
        ];
    }

    public function scanFarmers(?FarmerProfile $focus = null): int
    {
        $farmers = FarmerProfile::query()
            ->where('status', '!=', 'archived')
            ->orderBy('id')
            ->get();

        $created = 0;

        foreach ($farmers as $a) {
            if ($focus && $a->id !== $focus->id) {
                continue;
            }

            foreach ($farmers as $b) {
                if ($b->id <= $a->id) {
                    continue;
                }

                $hits = $this->compareFarmers($a, $b);
                if ($hits === []) {
                    continue;
                }

                $created += $this->flagPair(
                    FarmerProfile::class,
                    $a->id,
                    FarmerProfile::class,
                    $b->id,
                    $hits
                ) ? 1 : 0;
            }
        }

        return $created;
    }

    public function scanFarms(?Farm $focus = null): int
    {
        $farms = Farm::query()->where('status', 'active')->orderBy('id')->get();
        $created = 0;

        foreach ($farms as $a) {
            if ($focus && $a->id !== $focus->id) {
                continue;
            }

            foreach ($farms as $b) {
                if ($b->id <= $a->id) {
                    continue;
                }

                $hits = $this->compareFarms($a, $b);
                if ($hits === []) {
                    continue;
                }

                $created += $this->flagPair(
                    Farm::class,
                    $a->id,
                    Farm::class,
                    $b->id,
                    $hits
                ) ? 1 : 0;
            }
        }

        return $created;
    }

    public function scanBeneficiaries(): int
    {
        $rows = Beneficiary::query()->orderBy('id')->get();
        $created = 0;

        foreach ($rows as $a) {
            foreach ($rows as $b) {
                if ($b->id <= $a->id) {
                    continue;
                }

                $hits = [];
                if ($this->namesSimilar($a->fullName(), $b->fullName()) && $this->sameNormalized($a->barangay, $b->barangay)) {
                    $hits[] = 'similar_beneficiary_names';
                }
                if ($a->contact_number && $this->sameNormalized($a->contact_number, $b->contact_number)) {
                    $hits[] = 'same_contact_number';
                }
                if ($hits === []) {
                    continue;
                }

                $created += $this->flagRecords('beneficiary', [$a->id, $b->id], 'possible_duplicate', $hits) ? 1 : 0;
            }
        }

        return $created;
    }

    public function scanSubsidies(): int
    {
        $created = 0;
        $groups = SubsidyRecord::query()
            ->whereNotIn('status', ['rejected'])
            ->orderBy('id')
            ->get()
            ->groupBy(fn (SubsidyRecord $row) => ($row->farmer_profile_id ?: 'b'.$row->beneficiary_id).'|'.$this->normalize($row->subsidy_type));

        foreach ($groups as $group) {
            if ($group->count() < 2) {
                continue;
            }

            $ids = $group->take(2)->pluck('id')->all();
            $created += $this->flagRecords('subsidy', $ids, 'overlapping', ['same_subject_and_subsidy_type']) ? 1 : 0;
        }

        foreach (SubsidyRecord::query()->where('status', 'approved')->whereNull('amount')->get() as $row) {
            $created += $this->flagRecords('subsidy', [$row->id], 'inconsistent', ['approved_without_amount']) ? 1 : 0;
        }

        return $created;
    }

    public function scanIncomplete(): int
    {
        $created = 0;

        foreach (Farm::query()->where('status', 'active')->get() as $farm) {
            $hits = [];
            if ((float) $farm->area_hectares <= 0) {
                $hits[] = 'missing_land_area';
            }
            if (trim((string) $farm->location) === '') {
                $hits[] = 'missing_location';
            }
            if ($hits !== []) {
                $created += $this->flagRecords('farm', [$farm->id], 'incomplete', $hits) ? 1 : 0;
            }
        }

        return $created;
    }

    public function compareFarmers(FarmerProfile $a, FarmerProfile $b): array
    {
        $hits = [];

        if ($this->namesSimilar($a->fullName(), $b->fullName())) {
            $hits[] = 'similar_farmer_names';
        }

        if ($this->sameNormalized($a->addressLine(), $b->addressLine())) {
            $hits[] = 'same_address';
        }

        if ($a->contact_number && $this->sameNormalized($a->contact_number, $b->contact_number)) {
            $hits[] = 'same_contact_number';
        }

        $farmHits = $this->sharedFarmSignals($a, $b);
        $hits = array_merge($hits, $farmHits);

        return array_values(array_unique($hits));
    }

    public function compareFarms(Farm $a, Farm $b): array
    {
        $hits = [];

        if ($this->sameNormalized($a->location, $b->location) && $this->sameNormalized($a->barangay, $b->barangay)) {
            $hits[] = 'same_land_location';
        }

        if ((float) $a->area_hectares === (float) $b->area_hectares && $this->sameNormalized($a->barangay, $b->barangay)) {
            $hits[] = 'same_land_area';
        }

        if ($this->sameNormalized((string) $a->parcel_name, (string) $b->parcel_name)
            && $this->sameNormalized($a->land_classification, $b->land_classification)
            && $a->parcel_name) {
            $hits[] = 'similar_farm_information';
        }

        return $hits;
    }

    private function sharedFarmSignals(FarmerProfile $a, FarmerProfile $b): array
    {
        $hits = [];
        foreach ($a->farms as $fa) {
            foreach ($b->farms as $fb) {
                $hits = array_merge($hits, $this->compareFarms($fa, $fb));
                $leftCrops = $fa->productions->map(fn ($row) => $this->normalize((string) $row->crop_type))->filter();
                $rightCrops = $fb->productions->map(fn ($row) => $this->normalize((string) $row->crop_type))->filter();
                if ($leftCrops->intersect($rightCrops)->isNotEmpty()) {
                    $hits[] = 'same_crop';
                }
            }
        }

        return $hits;
    }

    public function namesSimilar(string $left, string $right): bool
    {
        $left = $this->normalize($left);
        $right = $this->normalize($right);

        if ($left === '' || $right === '') {
            return false;
        }

        if ($left === $right) {
            return true;
        }

        similar_text($left, $right, $percent);

        return $percent >= 82;
    }

    private function sameNormalized(?string $left, ?string $right): bool
    {
        if (! $left || ! $right) {
            return false;
        }

        return $this->normalize($left) === $this->normalize($right);
    }

    private function normalize(string $value): string
    {
        $value = strtolower(trim($value));
        $value = preg_replace('/[^a-z0-9]+/', ' ', $value) ?? $value;

        return trim($value);
    }

    private function flagPair(string $typeA, int $idA, string $typeB, int $idB, array $hits): bool
    {
        $exists = DuplicateReview::query()
            ->where(function ($q) use ($typeA, $idA, $typeB, $idB) {
                $q->where('original_type', $typeA)
                    ->where('original_id', $idA)
                    ->where('duplicate_type', $typeB)
                    ->where('duplicate_id', $idB);
            })
            ->orWhere(function ($q) use ($typeA, $idA, $typeB, $idB) {
                $q->where('original_type', $typeB)
                    ->where('original_id', $idB)
                    ->where('duplicate_type', $typeA)
                    ->where('duplicate_id', $idA);
            })
            ->exists();

        $newDuplicate = false;
        if (! $exists) {
            DuplicateReview::query()->create([
                'original_type' => $typeA,
                'original_id' => $idA,
                'duplicate_type' => $typeB,
                'duplicate_id' => $idB,
                'detection_method' => 'rule',
                'rule_hits' => $hits,
                'confidence' => min(99, 40 + (count($hits) * 12)),
                'review_status' => 'pending',
                'final_action' => 'none',
            ]);
            $newDuplicate = true;
        }

        $short = match ($typeA) {
            FarmerProfile::class => 'farmer',
            Farm::class => 'farm',
            default => 'record',
        };

        return $this->flagRecords($short, [$idA, $idB], 'possible_duplicate', $hits) || $newDuplicate;
    }

    private function flagRecords(string $type, array $ids, string $finding, array $hits): bool
    {
        return app(AiReviewStore::class)->flag($type, $ids, [
            'finding' => $finding,
            'rule_hits' => $hits,
            'explanation' => null,
            'advisory' => true,
        ], min(99, 40 + (count($hits) * 12))) !== null;
    }
}
