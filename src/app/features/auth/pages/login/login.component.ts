import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputPasswordComponent } from '../../../../shared/components/form/input-password/input-password.component';
import { InputEmailComponent } from '../../../../shared/components/form/input-email/input-email.component';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '@app/domains/user/user.entity';

export enum AuthContext {
  admin = 'ADMIN',
  medic = 'MEDIC',
  patient = 'PATIENT',
}
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    InputPasswordComponent,
    InputEmailComponent,
    RouterModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  public title: string = 'Bienvenido de nuevo a tu cuidado';
  public subtitle: string =
    'Inicia sesión para acceder a tu historial y citas.';
  public ctx!: AuthContext;
  // expose enum to template
  public AuthContext = AuthContext;

  public form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  // convenience getter for patient context
  public get isPatient(): boolean {
    return this.ctx === AuthContext.patient;
  }

  ngOnInit() {
    const context = this.route.snapshot.paramMap.get('context');
    this.ctx = (context || '').toUpperCase() as AuthContext;
    switch (this.ctx) {
      case AuthContext.admin:
        this.title = 'Panel administrativo Inicio de sesión';
        this.subtitle =
          'Accede como administrador para gestionar la plataforma.';
        break;
      case AuthContext.medic:
        this.title = 'Acceso profesional';
        this.subtitle =
          'Inicia sesión para acceder a tus pacientes y recursos clínicos.';
        break;
      case AuthContext.patient:
      default:
        this.title = 'Bienvenido de nuevo a tu cuidado';
        this.subtitle = 'Inicia sesión para acceder a tu historial y citas.';
        break;
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.value;
    this.authService.login(payload).subscribe({
      next: (res: any) => {
        console.log("🚀 ~ LoginComponent ~ submit ~ res:", res)
        // Expecting { accessToken: string, user: User } from API
        if (res && res.accessToken && res.user) {
          this.authService.setSession({
            accessToken: res.accessToken,
            user: res.user,
          });
          // this.redirectByRole(res.user);
          this.redirectByRole(res);
        } else if (res && res.user) {
          // fallback
          this.authService.setSession({
            accessToken: res.token || '',
            user: res.user,
          });
          // this.redirectByRole(res.user);
          this.redirectByRole(res);
        } else {
          // If API returns user directly
          const user: User = res as User;
          this.authService.setSession({ accessToken: res.token || '', user });
          // this.redirectByRole(user);
          this.redirectByRole(res);
        }
      },
      error: (err) => {
        console.error('Login error', err);
        // TODO: show UI feedback
      },
    });
  }

  private redirectByRole(user: User) {
    if (!user?.role) {
      this.router.navigate(['/']);
      return;
    }

    switch (user.role) {
      case 'ADMIN':
        this.router.navigate(['/dashboard/admin']);
        break;
      case 'PROVIDER':
        // this.router.navigate(['/dashboard/medical']);
        this.router.navigate(['/dashboard/admin']);
        break;
      case 'PATIENT':
      default:
        // this.router.navigate(['/dashboard/patient']);
        this.router.navigate(['/dashboard/admin']);
        break;
    }
  }
}
