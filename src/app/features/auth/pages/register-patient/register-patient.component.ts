import { Component } from '@angular/core';
import { InputEmailComponent } from '../../../../shared/components/form/input-email/input-email.component';
import { InputPasswordComponent } from '../../../../shared/components/form/input-password/input-password.component';
import { InputTextComponent } from '../../../../shared/components/form/input-text/input-text.component';
import { InputNumberComponent } from '../../../../shared/components/form/input-number/input-number.component';
import { SelectComponent } from '../../../../shared/components/form/select/select.component';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register-patient',
  standalone: true,
  imports: [
    InputEmailComponent,
    InputPasswordComponent,
    InputTextComponent,
    InputNumberComponent,
    SelectComponent,
    ReactiveFormsModule,
    RouterModule,
  ],
  templateUrl: './register-patient.component.html',
  styleUrl: './register-patient.component.scss',
})
export class RegisterPatientComponent {
  options = Array.from({ length: 22 }, (_, i) => ({
    value: i + 1,
    label: `Comuna ${i + 1}`,
  }));

  public form: FormGroup;
  public isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.buildForm();
  }

  private buildForm(): FormGroup {
    return this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
        firstName: ['', [Validators.required]],
        secondName: [''],
        lastName: ['', [Validators.required]],
        secondLastName: [''],
        number_document: [''],
        phone: [''],
        address: [''],
        barrio: [''],
        comuna: [''],
        city: [{ value: 'Cali, Valle', disabled: true }],
        terms: [false, [Validators.requiredTrue]],
      },
      { validators: this.passwordsMatchValidator },
    );
  }

  private passwordsMatchValidator: ValidatorFn = (control: AbstractControl) => {
    const pwd = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    return pwd === confirm ? null : { passwordsMismatch: true };
  };

  get f() {
    return this.form.controls;
  }
  
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { confirmPassword, terms, ...payload } = this.form.getRawValue();

    this.isSubmitting = true;

    this.authService.registerPatient(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/login/patient']);
      },
      error: () => {
        this.isSubmitting = false;
      },
    });
  }
}
