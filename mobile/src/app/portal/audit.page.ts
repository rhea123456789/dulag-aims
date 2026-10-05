import { Component, OnInit } from '@angular/core';
import { ApiService } from '../core/api.service';
import { AuditLog, Page, rowsOf } from '../core/models';

@Component({
  selector: 'app-audit',
  templateUrl: './audit.page.html',
  standalone: false,
})
export class AuditPage implements OnInit {
  rows: AuditLog[] = [];
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.get<Page<AuditLog>>('/audit-logs').subscribe({
      next: (page) => (this.rows = rowsOf(page)),
      error: (err: Error) => (this.error = err.message),
    });
  }
}
