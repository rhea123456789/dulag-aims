import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  standalone: false,
})
export class RegisterPage {
  kind: 'farmer' | 'beneficiary' = 'farmer';
  fullName = '';
  contactNumber = '';
  address = '';
  barangay = '';
  rsbsa = '';
  farmInformation = '';
  beneficiaryDetails = '';
  email = '';
  password = '';
  passwordConfirmation = '';
  error = '';
  message = '';
  busy = false;

  constructor(route: ActivatedRoute, private auth: AuthService, private router: Router) {
    const kind = route.snapshot.paramMap.get('kind');
    this.kind = kind === 'beneficiary' ? 'beneficiary' : 'farmer';
  }

  submit(): void {
    this.error = '';
    this.message = '';
    this.busy = true;
    const body: Record<string, string> = {
      type: this.kind,
      full_name: this.fullName.trim(),
      contact_number: this.contactNumber.trim(),
      address: this.address.trim(),
      barangay: this.barangay.trim(),
      email: this.email.trim(),
      password: this.password,
      password_confirmation: this.passwordConfirmation,
    };
    if (this.kind === 'farmer') {
      body['rsbsa_reference_number'] = this.rsbsa.trim();
      body['farm_information'] = this.farmInformation.trim();
    } else {
      body['beneficiary_details'] = this.beneficiaryDetails.trim();
    }
    this.auth.register(body).subscribe({
      next: (res) => {
        this.message = res.message;
        this.busy = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.busy = false;
      },
    });
  }

  goLogin(): void {
    void this.router.navigateByUrl('/login');
  }
}
