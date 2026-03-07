import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { UserService } from '@app/core/services/user.service';

@Component({
  selector: 'app-rol-provider',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rol-provider.component.html',
  styleUrl: './rol-provider.component.scss',
})
export class RolProviderComponent implements OnInit {
  providerForm!: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.providerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      documentNumber: [''],
      phone: [''],
      specialty: [''],
      licenseNumber: [''],
    });
  }

  // onSubmit(): void {
  //   if (this.providerForm.invalid) {
  //     this.errorMessage = 'Por favor completa todos los campos obligatorios';
  //     return;
  //   }

  //   this.isSubmitting = true;
  //   this.errorMessage = '';
  //   this.successMessage = '';

  //   const formData = this.providerForm.value;
  //   const providerData = {
  //     firstName: formData.firstName,
  //     lastName: formData.lastName,
  //     email: formData.email,
  //     password: formData.password,
  //     roleNames: ['PROVIDER'],
  //     documentNumber: formData.documentNumber || undefined,
  //     phone: formData.phone || undefined,
  //     specialty: formData.specialty || undefined,
  //     licenseNumber: formData.licenseNumber || undefined,
  //   };

  //   this.userService.createUser(providerData).subscribe({
  //     next: (response) => {
  //       this.successMessage = 'Médico creado exitosamente';
  //       this.providerForm.reset();
  //       this.isSubmitting = false;
  //       console.log('Provider creado:', response);
  //     },
  //     error: (error) => {
  //       console.error('Error al crear PROVEEDOR:', error);
  //       this.errorMessage =
  //         error.error?.message || 'Error al crear proveedor. Intenta de nuevo.';
  //       this.isSubmitting = false;
  //     },
  //   });
  // }

  // resetForm(): void {
  //   this.providerForm.reset();
  //   this.successMessage = '';
  //   this.errorMessage = '';
  //   this.showPassword = false;
  // }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
