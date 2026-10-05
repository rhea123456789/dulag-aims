import { Component, OnInit } from '@angular/core';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { AuditLog, Page, rowsOf } from '../core/models';

interface RoleRow {
  id: number;
  name: string;
  slug: string;
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  status: string;
  role_id: number;
  role?: { name: string | null } | null;
}

interface SettingRow {
  id: number;
  key: string;
  value: string | null;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  standalone: false,
})
export class ProfilePage implements OnInit {
  users: UserRow[] = [];
  roles: RoleRow[] = [];
  settings: SettingRow[] = [];
  logs: AuditLog[] = [];
  error = '';
  message = '';
  editing: number | null = null;
  name = '';
  email = '';
  password = '';
  roleId = '';
  status = 'active';

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    if (!this.auth.isAdmin()) return;
    this.api.get<Page<UserRow>>('/users', { page: '1' }).subscribe({
      next: (page) => (this.users = rowsOf(page)),
      error: (err: Error) => (this.error = err.message),
    });
    this.api.get<RoleRow[]>('/roles').subscribe({
      next: (rows) => (this.roles = Array.isArray(rows) ? rows : []),
      error: (err: Error) => (this.error = err.message),
    });
    this.api.get<SettingRow[]>('/settings').subscribe({
      next: (rows) => (this.settings = Array.isArray(rows) ? rows : []),
      error: (err: Error) => (this.error = err.message),
    });
    this.api.get<Page<AuditLog>>('/audit-logs', { page: '1' }).subscribe({
      next: (page) => (this.logs = rowsOf(page).slice(0, 8)),
      error: (err: Error) => (this.error = err.message),
    });
  }

  edit(row: UserRow): void {
    this.editing = row.id;
    this.name = row.name;
    this.email = row.email;
    this.password = '';
    this.roleId = String(row.role_id);
    this.status = row.status;
  }

  cancel(): void {
    this.editing = null;
    this.name = '';
    this.email = '';
    this.password = '';
    this.roleId = '';
    this.status = 'active';
  }

  saveUser(): void {
    this.error = '';
    this.message = '';
    const body: Record<string, string | number> = {
      name: this.name,
      email: this.email,
      role_id: Number(this.roleId),
      status: this.status,
    };
    if (this.password) body['password'] = this.password;
    const request = this.editing
      ? this.api.put(`/users/${this.editing}`, body)
      : this.api.post('/users', body);
    request.subscribe({
      next: () => {
        this.message = this.editing ? 'User updated.' : 'User created.';
        this.cancel();
        this.ngOnInit();
        this.auth.refresh().subscribe();
      },
      error: (err: Error) => (this.error = err.message),
    });
  }

  addSetting(): void {
    this.settings = [...this.settings, { id: 0, key: '', value: '' }];
  }

  saveSettings(): void {
    this.error = '';
    this.message = '';
    this.api.put<SettingRow[]>('/settings', {
      settings: this.settings.map((row) => ({ key: row.key, value: row.value ?? '' })),
    }).subscribe({
      next: (rows) => {
        this.settings = rows;
        this.message = 'Settings saved.';
      },
      error: (err: Error) => (this.error = err.message),
    });
  }
}
