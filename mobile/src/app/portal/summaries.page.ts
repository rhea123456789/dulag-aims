import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ApiService } from '../core/api.service';
import { Page, rowsOf } from '../core/models';

interface SummaryRow {
  id: number;
  generated_summary: string;
  source_records: { record_type?: string; record_ids?: number[]; source?: string; notice?: string | null };
  created_at?: string;
  author?: { name: string } | null;
}

interface Choice {
  id: number;
  label: string;
}

@Component({
  selector: 'app-summaries',
  templateUrl: './summaries.page.html',
  standalone: false,
})
export class SummariesPage implements OnInit {
  recordType = 'farmer';
  choices: Choice[] = [];
  selected: number[] = [];
  rows: SummaryRow[] = [];
  error = '';
  busy = false;
  readonly types = [
    { value: 'farmer', label: 'Farmer profiles' },
    { value: 'farm', label: 'Farm information' },
    { value: 'production', label: 'Production records' },
    { value: 'subsidy', label: 'Subsidy information' },
    { value: 'beneficiary', label: 'Beneficiary records' },
    { value: 'findings', label: 'Flagged findings' },
  ];

  constructor(private api: ApiService, private alerts: AlertController) {}

  ngOnInit(): void {
    this.loadChoices();
    this.loadSummaries();
  }

  loadChoices(): void {
    this.selected = [];
    this.choices = [];
    if (this.recordType === 'findings') {
      this.api.get<Page<{ id: number; record_type: string; ai_result: { finding?: string } | null }>>('/ai/reviews').subscribe({
        next: (page) => {
          this.choices = rowsOf(page).map((row) => ({
            id: row.id,
            label: `${row.record_type} ${row.id} · ${row.ai_result?.finding || 'finding'}`,
          }));
        },
        error: (err: Error) => (this.error = err.message),
      });
      return;
    }

    const path = this.recordType === 'farmer'
      ? '/farmers'
      : this.recordType === 'farm'
        ? '/farms'
        : this.recordType === 'production'
          ? '/productions'
          : this.recordType === 'beneficiary'
            ? '/beneficiaries'
            : '/subsidies';
    this.api.get<Page<Record<string, unknown>>>(path).subscribe({
      next: (page) => {
        this.choices = rowsOf(page).map((row) => ({
          id: Number(row['id']),
          label: this.labelFor(row),
        }));
      },
      error: (err: Error) => (this.error = err.message),
    });
  }

  toggle(id: number, checked: boolean): void {
    this.selected = checked ? [...this.selected, id] : this.selected.filter((item) => item !== id);
  }

  generate(): void {
    this.error = '';
    this.busy = true;
    this.api.post<SummaryRow>('/ai/summaries', {
      record_type: this.recordType,
      record_ids: this.selected,
    }).subscribe({
      next: () => {
        this.busy = false;
        this.selected = [];
        this.loadSummaries();
      },
      error: (err: Error) => {
        this.error = err.message;
        this.busy = false;
      },
    });
  }

  async remove(row: SummaryRow): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Delete summary',
      message: 'Delete this summary only? Farmer, farm, production, subsidy, and beneficiary records will not be changed.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: () => this.confirmRemove(row) },
      ],
    });
    await alert.present();
  }

  private confirmRemove(row: SummaryRow): void {
    this.error = '';
    this.api.delete(`/ai/summaries/${row.id}`).subscribe({
      next: () => this.loadSummaries(),
      error: (err: Error) => (this.error = err.message),
    });
  }

  loadSummaries(): void {
    this.api.get<Page<SummaryRow>>('/ai/summaries').subscribe({
      next: (page) => (this.rows = rowsOf(page)),
      error: (err: Error) => (this.error = err.message),
    });
  }

  summaryBlocks(raw: string): { kind: 'heading' | 'paragraph'; text: string }[] {
    const blocks: { kind: 'heading' | 'paragraph'; text: string }[] = [];
    let paragraph: string[] = [];
    const flush = () => {
      const text = cleanSummaryInline(paragraph.join(' '));
      if (text) blocks.push({ kind: 'paragraph', text });
      paragraph = [];
    };

    for (const line of raw.replace(/\r\n/g, '\n').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || /^([-*_])\1{2,}$/.test(trimmed) || /^```/.test(trimmed)) {
        flush();
        continue;
      }
      const hashed = trimmed.match(/^#{1,6}\s+(.*?)\s*#*$/);
      const bold = trimmed.match(/^(?:\*\*|__)(.+?)(?:\*\*|__)$/);
      const heading = hashed?.[1] ?? bold?.[1];
      if (heading) {
        flush();
        const text = cleanSummaryInline(heading);
        if (text) blocks.push({ kind: 'heading', text });
        continue;
      }
      const bullet = trimmed.match(/^[-*+]\s+(.*)$/);
      if (bullet || /^\d+[.)]\s+/.test(trimmed)) {
        flush();
        const text = cleanSummaryInline(bullet ? bullet[1] : trimmed);
        if (text) blocks.push({ kind: 'paragraph', text });
        continue;
      }
      paragraph.push(trimmed);
    }
    flush();
    return blocks;
  }

  private labelFor(row: Record<string, unknown>): string {
    if (typeof row['first_name'] === 'string') return `${row['first_name']} ${row['last_name'] ?? ''}`.trim();
    if (typeof row['location'] === 'string') return String(row['location']);
    if (typeof row['crop_type'] === 'string') return String(row['crop_type']);
    if (typeof row['subsidy_type'] === 'string') return String(row['subsidy_type']);
    return `Record ${row['id']}`;
  }
}

function cleanSummaryInline(value: string): string {
  return value
    .replace(/```/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s*/, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}
