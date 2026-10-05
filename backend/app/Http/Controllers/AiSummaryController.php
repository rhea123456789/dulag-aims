<?php

namespace App\Http\Controllers;

use App\Models\AiSummary;
use App\Services\AiSummaryService;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AiSummaryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            AiSummary::query()->with('author:id,name')->orderByDesc('id')->paginate(20)
        );
    }

    public function store(Request $request, AiSummaryService $summaries): JsonResponse
    {
        $data = $request->validate([
            'record_type' => ['required', Rule::in(['farmer', 'farm', 'production', 'subsidy', 'beneficiary', 'findings'])],
            'record_ids' => ['required', 'array', 'min:1', 'max:20'],
            'record_ids.*' => ['integer', 'min:1'],
        ]);

        $summary = $summaries->generate($request->user(), $data['record_type'], $data['record_ids']);
        app(AuditLogger::class)->record('Generated AI summary', 'ai_summaries', $summary, [
            'record_type' => $data['record_type'],
            'record_ids' => $data['record_ids'],
            'source' => $summary->source_records['source'] ?? null,
        ]);

        return response()->json($summary->load('author:id,name'), 201);
    }

    public function destroy(AiSummary $aiSummary): JsonResponse
    {
        app(AuditLogger::class)->record('Deleted AI summary', 'ai_summaries', $aiSummary, [
            'record_type' => $aiSummary->source_records['record_type'] ?? null,
            'record_ids' => $aiSummary->source_records['record_ids'] ?? null,
        ]);
        $aiSummary->delete();

        return response()->json([
            'message' => 'The summary was deleted. Agricultural records were not changed.',
        ]);
    }
}
