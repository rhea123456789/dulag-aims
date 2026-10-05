import { Component, OnInit } from '@angular/core';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Beneficiary, Page, rowsOf } from '../core/models';

@Component({
  selector: 'app-beneficiaries',
  templateUrl: './beneficiaries.page.html',
  standalone: false,
})
export class BeneficiariesPage implements OnInit {
  rows: Beneficiary[] = [];
  own: Beneficiary | null = null;
  error = '';

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    if (this.auth.hasRole('beneficiary')) {
      this.api.get<Beneficiary>('/my/beneficiary').subscribe({
        next: (row) => (this.own = row),
        error: (err: Error) => (this.error = err.message),
      });
      return;
    }
    this.api.get<Page<Beneficiary>>('/beneficiaries').subscribe({
      next: (page) => (this.rows = rowsOf(page)),
      error: (err: Error) => (this.error = err.message),
    });
  }
}
