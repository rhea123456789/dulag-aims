import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Farmer } from '../core/models';

interface FarmerDetail extends Farmer {
  middle_name?: string | null;
  suffix?: string | null;
  birthdate?: string | null;
  sex?: string | null;
  civil_status?: string | null;
  ownership_information?: string | null;
}

@Component({
  selector: 'app-farmer-profile',
  templateUrl: './farmer-profile.page.html',
  standalone: false,
})
export class FarmerProfilePage implements OnInit, OnDestroy {
  farmer: FarmerDetail | null = null;
  contact = '';
  street = '';
  notes = '';
  error = '';
  message = '';
  private params?: Subscription;

  constructor(
    private route: ActivatedRoute,
    public auth: AuthService,
    private api: ApiService,
    private zone: NgZone,
    private changes: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.params = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) this.load(id);
    });
  }

  ngOnDestroy(): void {
    this.params?.unsubscribe();
  }

  save(): void {
    if (!this.farmer) return;
    this.message = '';
    this.api.put<unknown>(`/farmers/${this.farmer.id}`, {
      contact_number: this.contact,
      street: this.street,
      notes: this.notes,
    }).subscribe({
      next: (body) => this.paint(() => {
        const farmer = this.farmerFrom(body);
        if (!farmer) {
          this.error = 'The farmer profile could not be read.';
          return;
        }
        this.apply(farmer);
        this.message = 'Profile updated.';
        this.error = '';
      }),
      error: (err: Error) => this.paint(() => { this.error = err.message; }),
    });
  }

  verify(): void {
    if (!this.farmer) return;
    this.api.post<unknown>(`/farmers/${this.farmer.id}/verify`, {}).subscribe({
      next: (body) => this.paint(() => {
        const farmer = this.farmerFrom(body);
        if (!farmer) {
          this.error = 'The farmer profile could not be read.';
          return;
        }
        this.apply(farmer);
        this.error = '';
      }),
      error: (err: Error) => this.paint(() => { this.error = err.message; }),
    });
  }

  private load(id: string): void {
    if (Capacitor.getPlatform() === 'android') {
      void this.loadOnAndroid(id);
      return;
    }
    this.api.get<unknown>(`/farmers/${id}`).subscribe({
      next: (body) => this.paint(() => this.showFarmer(body)),
      error: (err: Error) => this.paint(() => { this.error = err.message; }),
    });
  }

  private async loadOnAndroid(id: string): Promise<void> {
    const token = localStorage.getItem('aims_token');
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const response = await CapacitorHttp.get({
        url: `${this.api.baseUrl()}/farmers/${id}`,
        headers,
      });
      this.paint(() => {
        if (response.status < 200 || response.status >= 300) {
          this.farmer = null;
          this.error = this.messageFrom(response.data);
          return;
        }
        this.showFarmer(response.data);
      });
    } catch (err) {
      this.paint(() => {
        this.error = err instanceof Error ? err.message : 'The request could not be completed.';
      });
    }
  }

  private showFarmer(body: unknown): void {
    const farmer = this.farmerFrom(body);
    if (!farmer) {
      this.farmer = null;
      this.error = 'The farmer profile could not be read.';
      return;
    }
    this.apply(farmer);
    this.error = '';
  }

  private messageFrom(body: unknown): string {
    const value = this.unwrap(body);
    if (value && typeof value === 'object' && 'message' in value) {
      const message = (value as { message?: unknown }).message;
      if (typeof message === 'string' && message) return message;
    }
    return 'The request could not be completed.';
  }

  private apply(farmer: FarmerDetail): void {
    this.farmer = farmer;
    this.contact = farmer.contact_number ?? '';
    this.street = farmer.street ?? '';
    this.notes = farmer.notes ?? '';
  }

  private paint(update: () => void): void {
    this.zone.run(() => {
      update();
      this.changes.detectChanges();
    });
  }

  private farmerFrom(body: unknown): FarmerDetail | null {
    const value = this.unwrap(body);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as { data?: unknown; status?: unknown; headers?: unknown; id?: unknown; first_name?: unknown };
    if ('status' in record && 'headers' in record && 'data' in record && !('first_name' in record)) {
      return this.farmerFrom(record.data);
    }
    if (record.id != null && typeof record.first_name === 'string') return record as FarmerDetail;
    if (record.data && typeof record.data === 'object') return this.farmerFrom(record.data);
    return null;
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
