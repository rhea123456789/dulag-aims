import { Component, OnInit } from '@angular/core';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Beneficiary, Farmer, Page, rowsOf, Subsidy } from '../core/models';

@Component({
  selector: 'app-subsidies',
  templateUrl: './subsidies.page.html',
  standalone: false,
})
export class SubsidiesPage implements OnInit {
  rows: Subsidy[] = [];
  farmers: Farmer[] = [];
  beneficiaries: Beneficiary[] = [];
  error = '';
  message = '';
  subsidyType = '';
  applicationDate = '';
  amount = '';
  farmerId = '';
  beneficiaryId = '';
  readonly statuses = ['pending', 'under_review', 'approved', 'released', 'completed', 'rejected'];

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    this.load();
    if (this.auth.isOffice()) {
      this.api.get<Page<Farmer>>('/farmers').subscribe({ next: (page) => (this.farmers = rowsOf(page)) });
      this.api.get<Page<Beneficiary>>('/beneficiaries').subscribe({ next: (page) => (this.beneficiaries = rowsOf(page)) });
    }
  }

  load(): void {
    this.api.get<Page<Subsidy>>('/subsidies').subscribe({
      next: (page) => (this.rows = rowsOf(page)),
      error: (err: Error) => (this.error = err.message),
    });
  }

  save(): void {
    this.api.post('/subsidies', {
      farmer_profile_id: this.farmerId ? Number(this.farmerId) : null,
      beneficiary_id: this.beneficiaryId ? Number(this.beneficiaryId) : null,
      subsidy_type: this.subsidyType,
      application_date: this.applicationDate,
      amount: this.amount ? Number(this.amount) : null,
    }).subscribe({
      next: () => {
        this.message = 'Application recorded. Status is pending until the office reviews it.';
        this.load();
      },
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
