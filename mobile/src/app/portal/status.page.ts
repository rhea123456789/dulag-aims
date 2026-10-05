import { Component, OnInit } from '@angular/core';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Page, rowsOf, Subsidy } from '../core/models';

@Component({
  selector: 'app-status',
  templateUrl: './status.page.html',
  standalone: false,
})
export class StatusPage implements OnInit {
  rows: Subsidy[] = [];
  error = '';
  filter = '';
  readonly statuses = ['', 'pending', 'under_review', 'approved', 'released', 'completed', 'rejected'];

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const params: Record<string, string> = {};
    if (this.filter) params['status'] = this.filter;
    this.api.get<Page<Subsidy>>('/subsidies', params).subscribe({
      next: (page) => (this.rows = rowsOf(page)),
      error: (err: Error) => (this.error = err.message),
    });
  }

  setStatus(row: Subsidy, status: string): void {
    this.api.patch(`/subsidies/${row.id}/status`, { status }).subscribe({
      next: () => this.load(),
      error: (err: Error) => (this.error = err.message),
    });
  }
}
