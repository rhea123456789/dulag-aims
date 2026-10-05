<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Beneficiary;
use App\Models\Farm;
use App\Models\FarmerProfile;
use App\Models\ProductionRecord;
use App\Models\Role;
use App\Models\SubsidyRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AiWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_a_token_for_an_active_account(): void
    {
        $this->user(Role::MAO_PERSONNEL, 'mao@dulag.test');

        $this->postJson('/api/login', [
            'email' => 'mao@dulag.test',
            'password' => 'password',
        ])->assertOk()->assertJsonStructure(['token', 'user' => ['role']]);
    }

    public function test_similar_farmers_are_flagged_explained_and_decided_with_an_audit_log(): void
    {
        $admin = $this->user(Role::ADMINISTRATOR, 'admin@dulag.test');
        [$first, $second] = $this->similarFarmers();

        Sanctum::actingAs($admin);

        $this->postJson('/api/ai/reviews/scan')
            ->assertOk()
            ->assertJsonPath('message', 'Records were flagged for human review. Nothing was merged, deleted, approved, or rejected.');

        $review = collect($this->getJson('/api/ai/reviews')->assertOk()->json('data'))
            ->first(fn (array $row) => $row['record_type'] === 'farmer'
                && in_array($first->id, $row['record_ids'], true)
                && in_array($second->id, $row['record_ids'], true));

        $this->assertNotNull($review);
        $this->assertNotEmpty($review['ai_result']['rule_hits']);
        $this->assertContains('similar_farmer_names', $review['ai_result']['rule_hits']);
        $this->assertContains('same_crop', $review['ai_result']['rule_hits']);

        $assist = $this->postJson('/api/ai/reviews/'.$review['id'].'/assist')->assertOk();
        $explanation = (string) $assist->json('review.ai_result.explanation');
        $this->assertNotSame('', $explanation);
        $encoded = json_encode($assist->json());
        $this->assertStringNotContainsString('09171234567', $encoded);
        $this->assertStringNotContainsString('secret.farmer@dulag.test', $encoded);
        $this->assertStringNotContainsString('RSBSA-SECRET-1', $encoded);

        $this->postJson('/api/ai/reviews/'.$review['id'].'/decide', ['action' => 'keep_both'])
            ->assertOk()
            ->assertJsonPath('status', 'confirmed');

        $this->assertSame('Juan', $first->fresh()->first_name);
        $this->assertSame('Delacruz', $second->fresh()->last_name);

        foreach (['Ran AI duplicate scan', 'Requested Gemini duplicate suggestion', 'Reviewed AI suggestion'] as $action) {
            $log = AuditLog::query()->where('action', $action)->where('user_id', $admin->id)->first();
            $this->assertNotNull($log, $action);
            $this->assertNotNull($log->created_at);
        }
    }

    public function test_restricted_roles_cannot_open_ai_endpoints(): void
    {
        $admin = $this->user(Role::ADMINISTRATOR, 'guard.admin@dulag.test');
        [$farmer] = $this->similarFarmers();
        Sanctum::actingAs($admin);
        $summaryId = $this->postJson('/api/ai/summaries', [
            'record_type' => 'farmer',
            'record_ids' => [$farmer->id],
        ])->assertCreated()->json('id');

        foreach ([Role::FARMER, Role::BENEFICIARY, Role::TECHNICIAN, Role::RSBSA_FOCAL] as $slug) {
            Sanctum::actingAs($this->user($slug, $slug.'@dulag.test'));

            $this->getJson('/api/ai/reviews')->assertForbidden();
            $this->postJson('/api/ai/reviews/scan')->assertForbidden();
            $this->postJson('/api/ai/summaries', [
                'record_type' => 'farmer',
                'record_ids' => [1],
            ])->assertForbidden();
            $this->deleteJson('/api/ai/summaries/'.$summaryId)->assertForbidden();
        }

        $this->assertDatabaseHas('ai_summaries', ['id' => $summaryId]);
        $this->assertSame('Juan', $farmer->fresh()->first_name);
    }

    public function test_guests_cannot_open_ai_endpoints(): void
    {
        $this->getJson('/api/ai/reviews')->assertUnauthorized();
    }

    public function test_summaries_describe_records_without_sensitive_fields_or_decisions(): void
    {
        $admin = $this->user(Role::ADMINISTRATOR, 'summary.admin@dulag.test');
        [$farmer] = $this->similarFarmers();
        $farm = $farmer->farms()->first();
        $production = $farm->productions()->first();
        $subsidy = SubsidyRecord::query()->create([
            'farmer_profile_id' => $farmer->id,
            'subsidy_type' => 'Rice seed',
            'application_date' => '2026-06-01',
            'status' => 'pending',
        ]);
        $beneficiary = Beneficiary::query()->create([
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'barangay' => 'San Jose',
            'contact_number' => '09170000000',
            'address' => 'Hidden Street',
        ]);

        Sanctum::actingAs($admin);

        $cases = [
            'farmer' => [$farmer->id],
            'farm' => [$farm->id],
            'production' => [$production->id],
            'subsidy' => [$subsidy->id],
            'beneficiary' => [$beneficiary->id],
        ];

        foreach ($cases as $type => $ids) {
            $response = $this->postJson('/api/ai/summaries', [
                'record_type' => $type,
                'record_ids' => $ids,
            ])->assertCreated();

            $text = $response->json('generated_summary');
            $this->assertStringContainsString('does not approve, reject, merge, or delete', $text);
            $this->assertStringNotContainsString('09171234567', $text);
            $this->assertStringNotContainsString('09170000000', $text);
            $this->assertStringNotContainsString('secret.farmer@dulag.test', $text);
            $this->assertStringNotContainsString('RSBSA-SECRET-1', $text);
            $this->assertStringNotContainsString('Hidden Street', $text);
        }

        $log = AuditLog::query()->where('action', 'Generated AI summary')->where('user_id', $admin->id)->first();
        $this->assertNotNull($log);
        $this->assertNotNull($log->created_at);
        $this->assertSame($admin->id, \App\Models\AiSummary::query()->first()->created_by);
    }

    public function test_deleting_a_summary_does_not_remove_agricultural_records(): void
    {
        $admin = $this->user(Role::ADMINISTRATOR, 'delete.summary@dulag.test');
        [$farmer] = $this->similarFarmers();
        Sanctum::actingAs($admin);

        $created = $this->postJson('/api/ai/summaries', [
            'record_type' => 'farmer',
            'record_ids' => [$farmer->id],
        ])->assertCreated();

        $this->deleteJson('/api/ai/summaries/'.$created->json('id'))
            ->assertOk()
            ->assertJsonPath('message', 'The summary was deleted. Agricultural records were not changed.');

        $this->assertDatabaseMissing('ai_summaries', ['id' => $created->json('id')]);
        $this->assertSame('Juan', $farmer->fresh()->first_name);
        $this->assertSame(1, $farmer->farms()->count());
        $this->assertNotNull($farmer->farms()->first()->productions()->first());

        $log = AuditLog::query()->where('action', 'Deleted AI summary')->where('user_id', $admin->id)->first();
        $this->assertNotNull($log);
        $this->assertSame($created->json('id'), $log->record_id);
    }

    public function test_configured_gemini_stores_an_agriculture_summary_without_personal_data(): void
    {
        config([
            'services.gemini.enabled' => true,
            'services.gemini.key' => 'test-key',
            'services.gemini.model' => 'gemini-2.0-flash',
            'services.gemini.endpoint' => 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        ]);
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => ['parts' => [[
                        'text' => 'San Jose has recorded rice farmers and farm area for office review. No record was changed.',
                    ]]],
                ]],
            ]),
        ]);

        $admin = $this->user(Role::ADMINISTRATOR, 'gemini.admin@dulag.test');
        [$farmer] = $this->similarFarmers();
        Sanctum::actingAs($admin);

        $this->postJson('/api/ai/summaries', [
            'record_type' => 'farmer',
            'record_ids' => [$farmer->id],
        ])->assertCreated()
            ->assertJsonPath('source_records.source', 'gemini')
            ->assertJsonPath('author.name', 'gemini.admin@dulag.test');

        Http::assertSent(function ($request) {
            $body = $request->body();

            return str_contains($request->url(), 'generateContent')
                && str_contains($body, 'farmer information')
                && str_contains($body, 'production details')
                && str_contains($body, 'assistance records')
                && str_contains($body, '"maxOutputTokens":300')
                && ! str_contains($body, '09171234567')
                && ! str_contains($body, 'secret.farmer@dulag.test')
                && ! str_contains($body, 'RSBSA-SECRET-1')
                && ! str_contains($body, 'Poblacion Road');
        });

        $this->assertSame('Juan', $farmer->fresh()->first_name);
        $this->assertNotNull(\App\Models\AiSummary::query()->first()->created_at);
    }

    public function test_gemini_retries_a_temporary_outage_and_saves_a_fallback_if_it_continues(): void
    {
        config([
            'services.gemini.enabled' => true,
            'services.gemini.key' => 'test-key',
            'services.gemini.model' => 'gemini-2.0-flash',
            'services.gemini.endpoint' => 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        ]);

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::sequence()
                ->push(['error' => ['message' => 'The model is overloaded.']], 503)
                ->push([
                    'candidates' => [[
                        'content' => ['parts' => [[
                            'text' => 'Rice area in San Jose is recorded for staff review.',
                        ]]],
                    ]],
                ], 200),
        ]);

        $admin = $this->user(Role::ADMINISTRATOR, 'retry.admin@dulag.test');
        [$farmer] = $this->similarFarmers();
        Sanctum::actingAs($admin);

        $this->postJson('/api/ai/summaries', [
            'record_type' => 'farmer',
            'record_ids' => [$farmer->id],
        ])->assertCreated()->assertJsonPath('source_records.source', 'gemini');
        Http::assertSentCount(2);

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'error' => ['message' => 'The model is overloaded.'],
            ], 503),
        ]);

        $fallback = $this->postJson('/api/ai/summaries', [
            'record_type' => 'farmer',
            'record_ids' => [$farmer->id],
        ])->assertCreated();

        $fallback->assertJsonPath('source_records.source', 'fallback');
        $fallback->assertJsonPath('source_records.notice', 'Gemini is temporarily unavailable. A fallback summary was generated.');
        $this->assertStringNotContainsString('did not return a summary', (string) $fallback->json('generated_summary'));
        $this->assertStringContainsString('does not approve, reject, merge, or delete', (string) $fallback->json('generated_summary'));
        $this->assertSame('Juan', $farmer->fresh()->first_name);
    }

    public function test_gemini_text_is_saved_when_an_earlier_part_is_only_a_thought(): void
    {
        config([
            'services.gemini.enabled' => true,
            'services.gemini.key' => 'test-key',
            'services.gemini.model' => 'gemini-2.0-flash',
            'services.gemini.endpoint' => 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        ]);
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'finishReason' => 'STOP',
                    'content' => ['parts' => [
                        ['thought' => true, 'text' => 'internal reasoning'],
                        ['text' => 'San Jose has recorded rice area for staff review.'],
                    ]],
                ]],
            ]),
        ]);

        $admin = $this->user(Role::ADMINISTRATOR, 'parts.admin@dulag.test');
        [$farmer] = $this->similarFarmers();
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/ai/summaries', [
            'record_type' => 'farmer',
            'record_ids' => [$farmer->id],
        ])->assertCreated();

        $response->assertJsonPath('source_records.source', 'gemini');
        $response->assertJsonPath('source_records.notice', null);
        $this->assertStringContainsString('recorded rice area', (string) $response->json('generated_summary'));
        $this->assertStringNotContainsString('internal reasoning', (string) $response->json('generated_summary'));
        $this->assertStringNotContainsString('temporarily unavailable', (string) $response->json('generated_summary'));
    }

    public function test_gemini_retries_a_rate_limit_and_saves_the_later_text(): void
    {
        config([
            'services.gemini.enabled' => true,
            'services.gemini.key' => 'test-key',
            'services.gemini.model' => 'gemini-2.0-flash',
            'services.gemini.endpoint' => 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        ]);
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::sequence()
                ->push(['error' => ['message' => 'Quota exceeded. Please retry in 0.01s.']], 429)
                ->push([
                    'candidates' => [[
                        'content' => ['parts' => [[
                            'text' => 'Dulag farm records are ready for staff review.',
                        ]]],
                    ]],
                ], 200),
        ]);

        $admin = $this->user(Role::ADMINISTRATOR, 'rate.admin@dulag.test');
        [$farmer] = $this->similarFarmers();
        Sanctum::actingAs($admin);

        $this->postJson('/api/ai/summaries', [
            'record_type' => 'farmer',
            'record_ids' => [$farmer->id],
        ])->assertCreated()
            ->assertJsonPath('source_records.source', 'gemini')
            ->assertJsonPath('generated_summary', 'Dulag farm records are ready for staff review.');

        Http::assertSentCount(2);
    }

    public function test_a_long_gemini_rate_limit_saves_the_fallback_without_another_request(): void
    {
        config([
            'services.gemini.enabled' => true,
            'services.gemini.key' => 'test-key',
            'services.gemini.model' => 'gemini-2.0-flash',
            'services.gemini.endpoint' => 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        ]);
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'error' => ['message' => 'Quota exceeded. Please retry in 40s.'],
            ], 429),
        ]);

        $admin = $this->user(Role::ADMINISTRATOR, 'quota.admin@dulag.test');
        [$farmer] = $this->similarFarmers();
        Sanctum::actingAs($admin);

        $this->postJson('/api/ai/summaries', [
            'record_type' => 'farmer',
            'record_ids' => [$farmer->id],
        ])->assertCreated()
            ->assertJsonPath('source_records.source', 'fallback');

        Http::assertSentCount(1);
    }

    private function similarFarmers(): array
    {
        $first = FarmerProfile::query()->create([
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'contact_number' => '09171234567',
            'email' => 'secret.farmer@dulag.test',
            'street' => 'Poblacion Road',
            'barangay' => 'San Jose',
            'rsbsa_reference_number' => 'RSBSA-SECRET-1',
            'status' => 'active',
        ]);
        $second = FarmerProfile::query()->create([
            'first_name' => 'Juan',
            'last_name' => 'Delacruz',
            'contact_number' => '09179876543',
            'email' => 'other.farmer@dulag.test',
            'street' => 'Poblacion Road',
            'barangay' => 'San Jose',
            'rsbsa_reference_number' => 'RSBSA-SECRET-2',
            'status' => 'active',
        ]);

        foreach ([$first, $second] as $farmer) {
            $farm = Farm::query()->create([
                'farmer_profile_id' => $farmer->id,
                'location' => 'Sitio Palay',
                'barangay' => 'San Jose',
                'area_hectares' => 1.25,
                'status' => 'active',
            ]);
            ProductionRecord::query()->create([
                'farm_id' => $farm->id,
                'crop_type' => 'Rice',
                'quantity' => 100,
                'unit' => 'kg',
            ]);
        }

        return [$first, $second];
    }

    private function user(string $slug, string $email): User
    {
        $role = Role::query()->firstOrCreate(
            ['slug' => $slug],
            ['name' => str_replace('_', ' ', $slug)]
        );

        return User::query()->create([
            'name' => $email,
            'email' => $email,
            'password' => 'password',
            'role_id' => $role->id,
            'status' => 'active',
        ]);
    }
}
