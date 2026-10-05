import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Farmer } from '../core/models';

@Component({
  selector: 'app-farmers',
  templateUrl: './farmers.page.html',
  standalone: false,
})
export class FarmersPage implements OnInit {
  rows: Farmer[] = [];
  error = '';
  search = '';

  constructor(
    public auth: AuthService,
    private api: ApiService,
    private zone: NgZone,
    private changes: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const params: Record<string, string> = {};
    const search = (this.search || '').trim();
    if (search) params['search'] = search;
    this.api.get<unknown>('/farmers', params).subscribe({
      next: (body) => this.paint(() => {
        this.rows = this.farmersFrom(body);
        this.error = '';
      }),
      error: (err: Error) => this.paint(() => {
        this.error = err.message;
      }),
    });
  }

  private paint(update: () => void): void {
    this.zone.run(() => {
      update();
      this.changes.detectChanges();
    });
  }

  private farmersFrom(body: unknown): Farmer[] {
    const value = this.unwrap(body);
    if (Array.isArray(value)) return value as Farmer[];
    if (!value || typeof value !== 'object') return [];
    const record = value as { data?: unknown; status?: unknown; headers?: unknown };
    if ('status' in record && 'headers' in record && 'data' in record && !('current_page' in record)) {
      return this.farmersFrom(record.data);
    }
    if (Array.isArray(record.data)) return record.data as Farmer[];
    if (record.data && typeof record.data === 'object') return this.farmersFrom(record.data);
    return [];
  }

  private unwrap(body: unknown): unknown {
    if (typeof body !== 'string') return body;
    try {
      return JSON.parse(body) as unknown;
    } catch {
      return null;
    }
  }
}
