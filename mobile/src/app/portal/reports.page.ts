import { Component } from '@angular/core';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  standalone: false,
})
export class ReportsPage {
  error = '';
  busy = '';
  readonly reports = [
    ['farmers', 'Farmers'],
    ['farms', 'Farms'],
    ['production', 'Production'],
    ['subsidies', 'Subsidies'],
    ['beneficiaries', 'Beneficiaries'],
    ['duplicates', 'Duplicate reviews'],
  ] as const;

  constructor(private api: ApiService) {}

  download(type: string, format: 'pdf' | 'xlsx'): void {
    this.busy = `${type}-${format}`;
    this.error = '';
    this.api.blob(`/reports/${type}?format=${format}`).subscribe({
      next: (file) => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}-report.${format}`;
        link.click();
        URL.revokeObjectURL(url);
        this.busy = '';
      },
      error: (err: Error) => {
        this.error = err.message;
        this.busy = '';
      },
    });
  }
}
