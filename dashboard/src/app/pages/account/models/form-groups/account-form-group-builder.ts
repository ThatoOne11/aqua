import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export class AccountFormGroupBuilder {
  constructor(private fb: FormBuilder) {}

  buildLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  buildEmailForm(): FormGroup {
    return this.fb.group({
      email: ['', Validators.email],
    });
  }

  buildPasswordResetForm(): FormGroup {
    return this.fb.group({
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });
  }
}
