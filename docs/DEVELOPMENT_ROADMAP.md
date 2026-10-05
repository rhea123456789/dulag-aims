# Dulag AIMS — Analysis and Development Roadmap

**Project:** Farm and Agriculture Information Management Application  
**Office:** Municipal Agriculture Office (MAO) of Dulag, Leyte  
**Workspace:** `C:\Users\rayya\Projects\dulag-aims`  
**Updated:** 2026-09-24

This document is the implementation plan. Application code is not started in this step; remaining work is sequenced below and will be built module by module.

---

## 1. Research-paper analysis

A separate Chapters 1–3 PDF/Word file was not found on this machine. The kickoff specification is treated as the proposal (objectives, scope, limitations, stack, roles, and modules).

If the original paper is added later, schema and screens will be checked against it before any extra capability is added.

### Problem and purpose

MAO Dulag needs a **centralized, mobile** system for farm and agriculture records that currently sit in scattered registries. The app **complements** RSBSA and similar government registries. It stores a local **RSBSA reference number** only. It must **not** replace, sync-write, or modify external government databases.

### In scope (build these)

- Farmer/owner profiles, farm/landholdings, production, profit
- Subsidy applications and status workflow
- Beneficiary profiles and assistance history
- Descriptive dashboards and reports (counts, distributions, trends of recorded data)
- Status tracking (farmer verification, subsidy, duplicate review)
- Audit logging of important actions
- Strict RBAC for six roles
- Two-layer duplicate checking: deterministic rules, then Gemini **explanations**
- Android-compatible Ionic/Angular client, Laravel 12 REST API, MySQL 8

### Out of scope (do not build)

- Predictive analytics, ML yield models, weather or crop recommendations
- GIS/mapping beyond stored location text and barangay
- Direct RSBSA/DA API integration or mutation of external databases
- Automatic merge, delete, approve, reject, or invalidate from AI
- Chat, marketplace, IoT, payments, or other unlisted features

### Gemini policy (non-negotiable)

Gemini may only analyze already-flagged pairs and generate summaries/explanations.  
A human must always decide. Fail closed if the API is down (keep rule flags; use a local advisory sentence).  
Send minimized comparison data only (no full names, phones, emails, or IDs in the model payload).

### Roles (as specified)

| Role | Allowed |
|------|---------|
| System Administrator | Users, role assignment, system settings, audit logs |
| MAO Personnel | All agricultural records, dashboards, duplicate review, reports, verify AI suggestions |
| RSBSA Focal Person | Farmer registration, update, validate farmer data |
| Agricultural Technician / Rice AEW | Assigned farmers, monitoring, field submissions |
| Farmer | Own profile, own farms, own subsidy status |
| Beneficiary | Own beneficiary profile, own assistance/subsidy status |

**RBAC correction to apply:** technicians must **not** create/edit/archive full farmer registrations. That belongs to RSBSA Focal and MAO. Technicians may update monitoring/field production on assigned farms.

---

## 2. Current project structure (as of this analysis)

```
dulag-aims/
  docs/DEVELOPMENT_ROADMAP.md
  backend/                 Partial Laravel 12-style API (application classes only)
    app/Http/Controllers   Auth, User, Farmer, Farm, Production, Subsidy,
                           Beneficiary, Dashboard, Report, Duplicate, Audit
    app/Models             All required domain models
    app/Services           AuditLogger, DuplicateDetectionService, GeminiDuplicateAssistant
    app/Http/Middleware    EnsureRole
    database/migrations    Four migrations covering required tables
    routes/api.php         Sanctum + role-grouped routes
    config/                Partial config set
    composer.json          laravel/framework ^12, sanctum, dompdf, maatwebsite/excel
    artisan, public/index.php, bootstrap/
```

**Missing (the product is not runnable yet):**

| Area | Status |
|------|--------|
| `backend/vendor`, `composer.lock` | Absent — Composer never installed |
| Laravel runtime files (`phpunit.xml`, `storage/`, `bootstrap/cache`, `.htaccess`, factories, seeders, tests) | Absent |
| Git repository | Not initialized (Git was not on PATH previously) |
| `mobile/` Ionic + Angular app | **Absent** — no screens |
| Seed data / default admin | Absent |
| Form Request classes | Validation lives in controllers |
| Dedicated profit CRUD routes | Profit is nested inside production create only |
| Documentation (schema, API, install, user manual, architecture, testing) | Only this roadmap |
| Unit / integration / UAT artifacts | Absent |

**What already aligns with the paper (backend design, not yet executed):**

- Required tables and fields (users, roles, farmers, farms, production, profit, subsidies, beneficiaries, assistance, audit, duplicate reviews)
- Supporting tables: technician assignments, farm history, system settings, Sanctum tokens
- Sanctum login/logout/me; password hashing via Eloquent `hashed` cast
- Duplicate rules: similar names, same address, same contact, same land location/area, similar farm info; **flag only**
- Gemini assist endpoint with PII minimization and no merge/delete actions
- Dashboard aggregates (descriptive only)
- PDF/Excel report types listed in the proposal
- Subsidy statuses: pending, under_review, approved, released, completed, rejected

**Design issues to fix while completing the backend:**

1. Incomplete Laravel skeleton will not boot until a proper Laravel 12 project is installed and the app code is merged into it.
2. Technician currently authorized to write farmer profiles — tighten to proposal.
3. Farmer/beneficiary GET collection routes are not role-middleware-gated; they rely on `ScopeQuery` (keep scoping, add explicit 403 for beneficiary on farmer list).
4. Admin vs MAO: dashboard/reports are MAO; admin should not need agricultural CRUD. Keep admin on users/settings/audit; optional read-only dashboard is acceptable for operations, not extra features.
5. Duplicate `decide` must never apply merge/delete (already rejected). Keep `flag_for_manual_correction` as the strongest outcome.

---

## 3. Target architecture

```
Ionic 8 + Angular (mobile-first, Android)
        HTTPS JSON + Bearer token (Sanctum)
Laravel 12 REST API (PHP 8.2+)
        Eloquent + Form Requests + role middleware
MySQL 8 (normalized, InnoDB)
        Gemini generateContent (duplicate explanations only)
```

Theme: green, white, earth tones. Government agriculture look. Role-filtered menus.

---

## 4. Database (normalized plan — already migrated in source)

Keep these tables; do not add speculative ones.

1. `roles`, `users` (id, name, email, password, role_id, status, timestamps)
2. `farmer_profiles` — personal, contact, address, ownership, RSBSA reference, verification/archive status
3. `technician_farmer_assignments`
4. `farms` — owner, location, barangay, area, classification, arrangement, cultivation
5. `farm_history`
6. `production_records`
7. `profit_records` (1:1 production; profit = income − expenses)
8. `beneficiaries`
9. `subsidy_records` (status enum as specified)
10. `assistance_records`
11. `audit_logs` (user, action, module, morph record, changes, timestamp)
12. `duplicate_reviews`
13. `system_settings`

RSBSA numbers are local references only.

---

## 5. Agile module roadmap (what we will code next)

Work one module at a time. Before each module, chat will state: database, backend, frontend, tests.

### Phase 0 — Make the backend bootable (prerequisite)

- Install PHP 8.2+, Composer, Node, MySQL 8 (or document if missing)
- Create a complete Laravel 12 project and merge existing `app/`, `routes/`, `database/migrations`, `config` overlays
- Seed six roles + demo users (one per role) with hashed passwords
- `.env` from `.env.example`; Sanctum; CORS for Ionic `localhost:8100`

### Phase 1 — Foundation (proposal Phase 1)

| Module | Database | Backend | Frontend | Tests |
|--------|----------|---------|----------|-------|
| 1 Authentication | users, roles, tokens | Sanctum login/logout/me | Splash, Login, token storage, role routing | Invalid login, inactive user, token revoke |
| 2 User management | users, settings | Admin CRUD, assign roles | User Management screen | Non-admin 403 |
| 3 Farmer management | farmer_profiles, assignments | Add/edit/view/search/filter/archive/verify | Farmer List, Farmer Profile | Search/filter, archive, farmer sees only self, AEW sees assigned only |

### Phase 2 — Core records

| Module | Database | Backend | Frontend | Tests |
|--------|----------|---------|----------|-------|
| 4 Farms | farms, farm_history | CRUD, link farmer, history on update | Farm Details | History written on update |
| 5 Production + profit | production_records, profit_records | Record, history, summaries; profit calc | Production Records | Profit = income − expenses |
| 6 Subsidies | subsidy_records | Create + status transitions | Subsidy Management | Illegal status skip optional; all six statuses |
| 7 Beneficiaries | beneficiaries, assistance_records | Register, assistance, subsidy history | Beneficiary Management | Beneficiary self-scope |

### Phase 3 — Oversight

| Module | Database | Backend | Frontend | Tests |
|--------|----------|---------|----------|-------|
| 8 Dashboard | read-only aggregates | Counts, bar/pie/line datasets | Dashboard charts (descriptive) | Snapshot JSON shape; no forecast fields |
| 9 Reports | — | PDF + Excel six report types | Reports screen | Export 200 + file type |
| 10 Audit | audit_logs | List for admin; writer on mutations | Audit view (admin) | Create farmer produces log |

### Phase 4 — Duplicate intelligence

| Module | Database | Backend | Frontend | Tests |
|--------|----------|---------|----------|-------|
| 11 Rule scan | duplicate_reviews | Flag pairs; never merge | Duplicate Review queue | Name/address/contact/land rules |
| 12 Gemini assist | gemini_summary | Minimized payload; human decide | Assist + decide actions | Merge/delete rejected; AI optional |

### Phase 5 — Quality and documentation

- PHPUnit unit tests (duplicate rules, profit)
- Feature tests (authz matrix, subsidy status, scoping)
- UAT checklists per role
- Docs: `SCHEMA.md`, `API.md`, `INSTALL.md`, `USER_MANUAL.md`, `ARCHITECTURE.md`, `TESTING.md`

---

## 6. Ionic screens (all required)

1. Splash  
2. Login  
3. Dashboard  
4. Farmer List  
5. Farmer Profile  
6. Farm Details  
7. Production Records  
8. Subsidy Management  
9. Beneficiary Management  
10. Duplicate Review  
11. Reports  
12. User Management  

Menus hidden by role. Farmers never see User Management or Duplicate Review.

---

## 7. API surface (to complete, not expand)

- `POST /api/login` `POST /api/logout` `GET /api/me`
- Users/settings/audit (admin)
- Farmers, farms, productions (+ summaries), subsidies (+ status patch)
- Beneficiaries + assistance; `GET /api/my/beneficiary`
- Dashboard, reports `{type}?format=pdf|xlsx`
- Duplicates: list, show, scan, assist, decide

Do not add endpoints outside this list.

---

## 8. Immediate next step (after this analysis)

Phase 0 + Module 1: bootable Laravel 12 API with Sanctum, seeded roles, then Ionic splash + login.

No features beyond the proposal will be added.
