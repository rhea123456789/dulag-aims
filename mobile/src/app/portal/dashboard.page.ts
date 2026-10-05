import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Beneficiary, DashboardData, Farmer, Page, Subsidy, totalOf } from '../core/models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  standalone: false,
})
export class DashboardPage implements OnInit {
  error = '';
  loading = true;
  office: DashboardData | null = null;
  own = { farmers: 0, subsidies: 0, beneficiary: '' };

  constructor(
    public auth: AuthService,
    private api: ApiService,
    private zone: NgZone,
    private changes: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (this.auth.isOffice()) {
      this.api.get<unknown>('/dashboard').pipe(
        finalize(() => this.paint(() => { this.loading = false; })),
      ).subscribe({
        next: (body) => this.paint(() => {
          const data = this.asDashboard(body);
          if (!data) {
            this.error = 'The dashboard response could not be read.';
            return;
          }
          this.office = data;
        }),
        error: (err: Error) => this.paint(() => { this.error = err.message; }),
      });
      return;
    }

    if (this.auth.hasRole('farmer', 'rsbsa_focal_person', 'agricultural_technician')) {
      this.api.get<Page<Farmer>>('/farmers', { page: '1' }).subscribe({
        next: (page) => (this.own.farmers = totalOf(page)),
        error: (err: Error) => (this.error = err.message),
      });
    }

    if (!this.auth.hasRole('rsbsa_focal_person')) {
      this.api.get<Page<Subsidy>>('/subsidies', { page: '1' }).subscribe({
        next: (page) => (this.own.subsidies = totalOf(page)),
        error: () => undefined,
      });
    }

    if (this.auth.hasRole('beneficiary')) {
      this.api.get<Beneficiary>('/my/beneficiary').subscribe({
        next: (profile) => (this.own.beneficiary = `${profile.first_name} ${profile.last_name}`.trim()),
        error: (err: Error) => (this.error = err.message),
      });
    }

    this.loading = false;
  }

  bars(rows: { label: string; value: string | number }[]): { label: string; value: number; width: number }[] {
    const values = rows.map((row) => ({ label: row.label || 'Unspecified', value: Number(row.value) || 0 }));
    const max = Math.max(...values.map((row) => row.value), 1);
    return values.map((row) => ({ ...row, width: Math.round((row.value / max) * 100) }));
  }

  barangayBars() {
    return this.bars(this.list(this.office?.farmers_by_barangay).map((row) => ({ label: row.barangay, value: row.total })));
  }

  statusBars() {
    return this.bars(Object.entries(this.record(this.office?.subsidy_by_status)).map(([key, value]) => ({
      label: key.replace(/_/g, ' '),
      value,
    })));
  }

  cropBars() {
    return this.bars(this.list(this.office?.production_by_crop).map((row) => ({ label: row.crop_type, value: row.total_quantity })));
  }

  trendBars() {
    return this.bars(this.list(this.office?.production_trend).map((row) => ({ label: row.month, value: row.total_quantity })));
  }

  private paint(update: () => void): void {
    this.zone.run(() => {
      update();
      this.changes.detectChanges();
    });
  }

  private asDashboard(body: unknown): DashboardData | null {
    let value = this.unwrap(body);
    if (this.isEnvelope(value)) value = this.unwrap(value.data);
    if (!value || typeof value !== 'object' || !('totals' in value)) return null;
    return value as DashboardData;
  }

  private unwrap(body: unknown): unknown {
    if (typeof body !== 'string') return body;
    try {
      return JSON.parse(body) as unknown;
    } catch {
      return null;
    }
  }

  private isEnvelope(value: unknown): value is { data: unknown } {
    return !!value && typeof value === 'object' && 'data' in value && 'status' in value && !('totals' in value);
  }

  private list<T>(value: T[] | null | undefined): T[] {
    return Array.isArray(value) ? value : [];
  }

  private record(value: unknown): Record<string, string | number> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, string | number>;
  }
}
