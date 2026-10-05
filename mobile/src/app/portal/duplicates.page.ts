import { Component, OnInit } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Page, rowsOf } from '../core/models';

interface AiReviewRow {
  id: number;
  record_type: string;
  confidence: string | number | null;
  status: string;
  ai_result: { explanation?: string | null; finding?: string; source?: string } | null;
  records: { id: number; label: string; detail: string }[];
}

@Component({
  selector: 'app-duplicates',
  templateUrl: './duplicates.page.html',
  standalone: false,
})
export class DuplicatesPage implements OnInit {
  rows: AiReviewRow[] = [];
  error = '';
  notice = 'Gemini suggestions are advisory. A staff member decides. Records are never merged, deleted, approved, or rejected.';
  busy = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.get<Page<AiReviewRow>>('/ai/reviews').subscribe({
      next: (page) => (this.rows = rowsOf(page)),
      error: (err: Error) => (this.error = err.message),
    });
  }

  scan(): void {
    this.busy = true;
    this.api.post<{ message: string }>('/ai/reviews/scan', {}).subscribe({
      next: (res) => {
        this.notice = res.message;
        this.busy = false;
        this.load();
      },
      error: (err: Error) => {
        this.error = err.message;
        this.busy = false;
      },
    });
  }

  assist(row: AiReviewRow): void {
    this.api.post<{ review: AiReviewRow; notice: string }>(`/ai/reviews/${row.id}/assist`, {}).subscribe({
      next: (res) => {
        Object.assign(row, res.review);
        this.notice = res.notice;
      },
      error: (err: Error) => (this.error = err.message),
    });
  }

  decide(row: AiReviewRow, action: 'keep_both' | 'mark_for_correction' | 'dismiss'): void {
    this.api.post<AiReviewRow>(`/ai/reviews/${row.id}/decide`, { action }).subscribe({
      next: () => this.load(),
      error: (err: Error) => (this.error = err.message),
    });
  }
}
