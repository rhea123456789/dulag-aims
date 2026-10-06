<?php

use App\Http\Controllers\AiReviewController;
use App\Http\Controllers\AiSummaryController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BeneficiaryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DuplicateReviewController;
use App\Http\Controllers\FarmController;
use App\Http\Controllers\FarmerController;
use App\Http\Controllers\ProductionController;
use App\Http\Controllers\ProfileCompletionController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SubsidyController;
use App\Http\Controllers\UserController;
use App\Models\Role;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [RegisterController::class, 'store'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/profile/completion', [ProfileCompletionController::class, 'show']);
    Route::put('/profile/completion', [ProfileCompletionController::class, 'update']);

    Route::middleware('role:'.Role::ADMINISTRATOR)->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::get('/roles', [UserController::class, 'roles']);
        Route::get('/settings', [UserController::class, 'settings']);
        Route::put('/settings', [UserController::class, 'updateSettings']);
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
    });

    Route::middleware('role:'.Role::MAO_PERSONNEL.','.Role::ADMINISTRATOR)->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'show']);
        Route::get('/reports/{type}', [ReportController::class, 'export']);
        Route::get('/duplicates', [DuplicateReviewController::class, 'index']);
        Route::get('/duplicates/{duplicate}', [DuplicateReviewController::class, 'show']);
        Route::post('/duplicates/scan', [DuplicateReviewController::class, 'scan']);
        Route::post('/duplicates/{duplicate}/assist', [DuplicateReviewController::class, 'assist']);
        Route::post('/duplicates/{duplicate}/decide', [DuplicateReviewController::class, 'decide']);
        Route::get('/ai/reviews', [AiReviewController::class, 'index']);
        Route::post('/ai/reviews/scan', [AiReviewController::class, 'scan']);
        Route::post('/ai/reviews/{aiReview}/assist', [AiReviewController::class, 'assist']);
        Route::post('/ai/reviews/{aiReview}/decide', [AiReviewController::class, 'decide']);
        Route::get('/ai/summaries', [AiSummaryController::class, 'index']);
        Route::post('/ai/summaries', [AiSummaryController::class, 'store']);
        Route::delete('/ai/summaries/{aiSummary}', [AiSummaryController::class, 'destroy']);
        Route::get('/beneficiaries', [BeneficiaryController::class, 'index']);
        Route::post('/beneficiaries', [BeneficiaryController::class, 'store']);
        Route::get('/beneficiaries/{beneficiary}', [BeneficiaryController::class, 'show']);
        Route::post('/beneficiaries/{beneficiary}/assistance', [BeneficiaryController::class, 'addAssistance']);
        Route::post('/subsidies', [SubsidyController::class, 'store']);
        Route::patch('/subsidies/{subsidy}/status', [SubsidyController::class, 'updateStatus']);
    });

    Route::get('/my/beneficiary', [BeneficiaryController::class, 'me']);

    Route::get('/farmers', [FarmerController::class, 'index']);
    Route::get('/farmers/{farmer}', [FarmerController::class, 'show']);
    Route::post('/farmers', [FarmerController::class, 'store']);
    Route::put('/farmers/{farmer}', [FarmerController::class, 'update']);
    Route::post('/farmers/{farmer}/archive', [FarmerController::class, 'archive']);
    Route::post('/farmers/{farmer}/verify', [FarmerController::class, 'verify']);

    Route::get('/farms', [FarmController::class, 'index']);
    Route::post('/farms', [FarmController::class, 'store']);
    Route::get('/farms/{farm}', [FarmController::class, 'show']);
    Route::put('/farms/{farm}', [FarmController::class, 'update']);

    Route::get('/productions', [ProductionController::class, 'index']);
    Route::get('/productions/summaries', [ProductionController::class, 'summaries']);
    Route::post('/productions', [ProductionController::class, 'store']);
    Route::get('/productions/{production}', [ProductionController::class, 'show']);

    Route::get('/subsidies', [SubsidyController::class, 'index']);
    Route::get('/subsidies/{subsidy}', [SubsidyController::class, 'show']);
});
