import { Component, OnInit } from '@angular/core';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Farm, Farmer, Page, rowsOf } from '../core/models';

@Component({
  selector: 'app-farms',
  templateUrl: './farms.page.html',
  standalone: false,
})
export class FarmsPage implements OnInit {
  rows: Farm[] = [];
  farmers: Farmer[] = [];
  error = '';
  message = '';
  location = '';
  barangay = '';
  area = '';
  farmerId = '';

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    this.load();
    if (this.auth.isStaff()) {
      this.api.get<Page<Farmer>>('/farmers').subscribe({ next: (page) => (this.farmers = rowsOf(page)) });
    }
  }

  load(): void {
    this.api.get<Page<Farm>>('/farms').subscribe({
      next: (page) => (this.rows = rowsOf(page)),
      error: (err: Error) => (this.error = err.message),
    });
  }

  save(): void {
    this.error = '';
    this.api.post('/farms', {
      farmer_profile_id: Number(this.farmerId),
      location: this.location,
      barangay: this.barangay,
      area_hectares: Number(this.area),
    }).subscribe({
      next: () => {
        this.message = 'Farm record saved.';
        this.location = '';
        this.barangay = '';
        this.area = '';
        this.load();
      },
      error: (err: Error) => (this.error = err.message),
    });
  }
}
