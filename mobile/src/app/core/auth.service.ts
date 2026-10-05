import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthUser, OFFICE_ROLES, RoleSlug, STAFF_ROLES } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<AuthUser | null>(this.readUser());
  readonly user$ = this.userSubject.asObservable();

  constructor(private api: ApiService, private router: Router) {}

  user(): AuthUser | null {
    return this.userSubject.value;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('aims_token') && !!this.user();
  }

  slug(): RoleSlug | null {
    return this.user()?.role.slug ?? null;
  }

  hasRole(...roles: RoleSlug[]): boolean {
    const slug = this.slug();
    return !!slug && roles.includes(slug);
  }

  isStaff(): boolean {
    return this.hasRole(...STAFF_ROLES);
  }

  isOffice(): boolean {
    return this.hasRole(...OFFICE_ROLES);
  }

  isAdmin(): boolean {
    return this.hasRole('system_administrator');
  }

  refresh(): Observable<AuthUser> {
    return this.api.get<{ user: AuthUser }>('/me').pipe(
      tap((res) => {
        const token = localStorage.getItem('aims_token');
        if (token) this.persist(token, res.user);
      }),
      map((res) => res.user),
    );
  }

  login(email: string, password: string): Observable<{ token: string; user: AuthUser }> {
    return this.api.post<{ token: string; user: AuthUser }>('/login', { email, password }).pipe(
      tap((res) => this.persist(res.token, res.user)),
    );
  }

  register(body: Record<string, string>): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/register', body);
  }

  logout(): void {
    this.api.post('/logout', {}).subscribe({ complete: () => this.clear(), error: () => this.clear() });
  }

  homeRoute(): string {
    if (this.hasRole('farmer')) return '/app/dashboard';
    if (this.hasRole('beneficiary')) return '/app/dashboard';
    return '/app/dashboard';
  }

  private persist(token: string, user: AuthUser): void {
    localStorage.setItem('aims_token', token);
    localStorage.setItem('aims_user', JSON.stringify(user));
    this.userSubject.next(user);
  }

  private clear(): void {
    localStorage.removeItem('aims_token');
    localStorage.removeItem('aims_user');
    this.userSubject.next(null);
    void this.router.navigateByUrl('/login');
  }

  private readUser(): AuthUser | null {
    const raw = localStorage.getItem('aims_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
