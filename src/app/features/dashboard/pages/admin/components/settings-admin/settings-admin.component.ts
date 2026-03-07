import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '@app/core/services/user.service';
import { UpdateUserDto } from '@app/domains/user/user-update.entity';
import { User } from '@app/domains/user/user.entity';

import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@app/features/auth/services/auth.service';

@Component({
  selector: 'app-settings-admin',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './settings-admin.component.html',
  styleUrl: './settings-admin.component.scss',
})
export class SettingsAdminComponent implements OnInit {
  userForm!: FormGroup;
  passwordForm!: FormGroup;
  isLoading = false;
  isPasswordLoading = false;
  isPasswordFormLoading = true;
  showPasswordSuccessModal = false;
  selectedUserId!: string;
  currentUser!: User;
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.userService.getCurrentUser().subscribe((fullUser) => {
      this.currentUser = fullUser;
      this.selectedUserId = fullUser.id;
      this.initializeForm(fullUser);
      this.initializePasswordForm();
      this.isPasswordFormLoading = false;
    });
  }

  initializeForm(user?: User): void {
    this.userForm = this.fb.group({
      email: [user?.email || '', [Validators.required, Validators.email]],
      password: [''],
      status: [user?.status || 'ACTIVE'],
      firstName: [user?.firstName || ''],
      middleName: [user?.middleName || ''],
      lastName: [user?.lastName || ''],
      secondLastName: [user?.secondLastName || ''],
      documentType: [user?.documentType || 'CC'],
      documentNumber: [user?.documentNumber || ''],
      birthDate: [user?.birthDate || ''],
      gender: [user?.gender || ''],
      phone: [user?.phone || ''],
      countryCode: [user?.countryCode || '+57'],
      address: [user?.address || ''],
      neighborhood: [user?.neighborhood || ''],
      commune: [user?.commune ?? null],
      city: [user?.city || ''],
      department: [user?.department || ''],
      roles: [user?.roles || []],
    });
  }

  initializePasswordForm(): void {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmNewPassword: ['', Validators.required],
      },
      { validators: this.passwordsMatchValidator },
    );
  }

  passwordsMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmNewPassword = form.get('confirmNewPassword')?.value;
    return newPassword === confirmNewPassword
      ? null
      : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.updateUserHandler(this.selectedUserId, this.userForm.value);
    }
  }

  onPasswordChange() {
    if (this.passwordForm.valid) {
      this.isPasswordLoading = true;
      const { currentPassword, newPassword, confirmNewPassword } =
        this.passwordForm.value;

      this.authService
        .changePassword(currentPassword, newPassword, confirmNewPassword)
        .subscribe({
          next: (res) => {
            this.showPasswordSuccessModal = true;
            this.passwordForm.reset();
          },
          error: (err) => {},
          complete: () => {
            this.isPasswordLoading = false;
          },
        });
    } else {
      this.passwordForm.markAllAsTouched();
    }
  }

  updateUserHandler(userId: string, formValue: User) {
    this.isLoading = true;
    // Mapear datos del formulario a UpdateUserDto
    const dto: UpdateUserDto = {
      targetUserId: userId,
      currentUser:{
      id: this.currentUser.id,
      roles: this.currentUser.roles,
    },
      userData: {
        email: formValue.email,
        status: formValue.status,
      },
      profileData: {
        first_name: formValue.firstName,
        middle_name: formValue.middleName || undefined,
        last_name: formValue.lastName,
        second_last_name: formValue.secondLastName || undefined,
        document_type: formValue.documentType,
        document_number: formValue.documentNumber!.toString() || undefined,
        birth_date: formValue.birthDate  || undefined,
        gender: formValue.gender  || undefined,
        phone: formValue.phone  || undefined,
        country_code: formValue.countryCode,
        address: formValue.address  || undefined,
        neighborhood: formValue.neighborhood  || undefined,
        commune: Number(formValue.commune) || undefined,
        city: formValue.city  || undefined,
        department: formValue.department  || undefined,
      },
      roles: formValue.roles,
    };
    this.userService.updateUser(userId, dto).subscribe({
      next: (updatedUser) => {
        console.log('Usuario actualizado:', updatedUser);
        // Aquí puedes actualizar el estado local o mostrar feedback al usuario
      },
      error: (err) => {
        console.error('Error al actualizar usuario', err);
        // Mostrar mensaje de error en UI
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
