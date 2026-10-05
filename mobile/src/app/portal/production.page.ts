import { Component, OnInit } from '@angular/core';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Farm, Page, Production, rowsOf } from '../core/models';

@Component({
  selector: 'app-production',
  templateUrl: './production.page.html',
  standalone: false,
})
export class ProductionPage implements OnInit {
  rows: Production[] = [];
  farms: Farm[] = [];
  error = '';
  message = '';
  farmId = '';
  crop = '';
  quantity = '';
  unit = 'kg';
  season = '';

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    this.api.get<Page<Production>>('/productions').subscribe({
      next: (page) => (this.rows = rowsOf(page)),
      error: (err: Error) => (this.error = err.message),
    });
    if (this.auth.isStaff()) {
      this.api.get<Page<Farm>>('/farms').subscribe({ next: (page) => (this.farms = rowsOf(page)) });
    }
  }

  save(): void {
    this.api.post('/productions', {
      farm_id: Number(this.farmId),
      crop_type: this.crop,
      quantity: this.quantity ? Number(this.quantity) : null,
      unit: this.unit,
      season: this.season || null,
    }).subscribe({
      next: () => {
        this.message = 'Production record saved.';
        this.ngOnInit();
      },
      error: (err: Error) => (this.error = err.message),
    });
  }
}
