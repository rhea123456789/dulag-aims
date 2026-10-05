import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  baseUrl(): string {
    const platform = (window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor?.getPlatform?.();
    return platform === 'android' ? environment.androidApiUrl : environment.apiUrl;
  }

  get<T>(path: string, params?: Record<string, string>): Observable<T> {
    return this.send(this.http.get<T>(this.baseUrl() + path, { headers: this.headers(), params }));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.send(this.http.post<T>(this.baseUrl() + path, body, { headers: this.headers() }));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.send(this.http.put<T>(this.baseUrl() + path, body, { headers: this.headers() }));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.send(this.http.patch<T>(this.baseUrl() + path, body, { headers: this.headers() }));
  }

  delete<T>(path: string): Observable<T> {
    return this.send(this.http.delete<T>(this.baseUrl() + path, { headers: this.headers() }));
  }

  blob(path: string): Observable<Blob> {
    return this.http.get(this.baseUrl() + path, { headers: this.headers(), responseType: 'blob' }).pipe(
      timeout(20000),
      catchError((err: unknown) => this.fail(err)),
    );
  }

  private send<T>(request: Observable<T>): Observable<T> {
    return request.pipe(
      timeout(20000),
      map((body) => this.decode(body)),
      catchError((err: unknown) => this.fail(err)),
    );
  }

  private decode<T>(body: T): T {
    if (typeof body !== 'string') return body;
    try {
      return JSON.parse(body) as T;
    } catch {
      return body;
    }
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('aims_token');
    let headers = new HttpHeaders({ Accept: 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  private fail(err: unknown): Observable<never> {
    if (err instanceof TimeoutError) {
      return throwError(() => new Error(`No response from ${this.baseUrl()}. Check that the phone and the API are on the same network.`));
    }
    const httpError = err as HttpErrorResponse;
    if (httpError.status === 0) return throwError(() => new Error(`Cannot reach ${this.baseUrl()}. Check that the phone and the API are on the same network.`));
    if (httpError.status >= 500) return throwError(() => new Error(httpError.message || 'The server could not complete the request.'));
    let raw: unknown = httpError.error;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {
        raw = { message: raw };
      }
    }
    const body = raw as { message?: string; errors?: Record<string, string[]> } | null;
    let message = body?.message || 'The request could not be completed.';
    const errors = body?.errors;
    if (errors) {
      const first = Object.values(errors)[0];
      if (first?.[0]) message = first[0];
    }
    return throwError(() => new Error(message));
  }
}
