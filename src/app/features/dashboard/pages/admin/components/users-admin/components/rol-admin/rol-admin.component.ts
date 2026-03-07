import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { UserService } from '@app/core/services/user.service';

@Component({
  selector: 'app-rol-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rol-admin.component.html',
  styleUrl: './rol-admin.component.scss',
})
export class RolAdminComponent implements OnInit {
  adminForm!: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  showPassword = false;
  @Output() formDataChange = new EventEmitter<any>();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.adminForm = this.fb.group({
      // Datos obligatorios
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      documentNumber: [null, [Validators.required, Validators.minLength(5)]],

      // Datos opcionales
      middleName: [''],
      secondLastName: [''],
      phone: [''],
    });
    this.adminForm.valueChanges.subscribe((value) => {
      this.formDataChange.emit(value);
    });
  }

  getFormData(): any {
    return this.adminForm.value;
  }

  onSubmit(): void {
    if (this.adminForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos obligatorios';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.adminForm.value;
    const adminData: any = {
      email: formData.email,
      password: formData.password,
      roleNames: ['ADMIN'],
      firstName: formData.firstName,
      lastName: formData.lastName,
      documentType: 'CC',
      documentNumber: formData.documentNumber || undefined,
    };
    // Campos opcionales
    if (formData.middleName) adminData.middleName = formData.middleName;
    if (formData.secondLastName)
      adminData.secondLastName = formData.secondLastName;
    if (formData.phone) adminData.phone = formData.phone;

    console.log('🚀 ~ RolAdminComponent ~ onSubmit ~ adminData:', adminData);
    this.userService.createUser({admin: adminData}).subscribe({
      next: (response) => {
        this.successMessage = 'Administrador creado exitosamente';
        this.adminForm.reset();
        this.isSubmitting = false;
        console.log('Admin creado:', response);
      },
      error: (error) => {
        console.error('Error al crear administrador:', error);
        this.errorMessage =
          error.error?.message ||
          'Error al crear administrador. Intenta de nuevo.';
        this.isSubmitting = false;
      },
    });
  }

  resetForm(): void {
    this.adminForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
    this.showPassword = false;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
