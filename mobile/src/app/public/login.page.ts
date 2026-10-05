import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { IonInput, ViewDidEnter, ViewWillEnter } from '@ionic/angular';
import { Subscription, finalize } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  standalone: false,
})
export class LoginPage implements OnInit, OnDestroy, ViewWillEnter, ViewDidEnter {
  @ViewChild('emailInput') emailInput?: IonInput;
  @ViewChild('passwordInput') passwordInput?: IonInput;

  email = '';
  password = '';
  error = '';
  busy = false;
  private viewReady = false;
  private navigation?: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router,
    private zone: NgZone,
    private changes: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.reset();
    this.navigation = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      filter((event) => event.urlAfterRedirects.split('?')[0] === '/login'),
    ).subscribe(() => this.reset());
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
  }

  ionViewWillEnter(): void {
    this.reset();
  }

  ionViewDidEnter(): void {
    this.viewReady = true;
    this.reset();
  }

  ngOnDestroy(): void {
    this.navigation?.unsubscribe();
  }

  submit(): void {
    this.error = '';
    this.busy = true;
    this.auth.login(this.email.trim(), this.password).pipe(
      finalize(() => this.paint(() => { this.busy = false; })),
    ).subscribe({
      next: () => void this.router.navigateByUrl('/app/dashboard'),
      error: (err: Error) => this.paint(() => { this.error = err.message || 'Sign in failed.'; }),
    });
  }

  private reset(): void {
    this.paint(() => {
      this.email = '';
      this.password = '';
      this.error = '';
      this.busy = false;
      if (this.emailInput) this.emailInput.value = '';
      if (this.passwordInput) this.passwordInput.value = '';
      if (this.auth.isLoggedIn()) void this.router.navigateByUrl('/app/dashboard');
    });
  }

  private paint(update: () => void): void {
    this.zone.run(() => {
      update();
      if (this.viewReady) this.changes.detectChanges();
    });
  }
}
