import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
	FormBuilder,
	FormGroup,
	Validators,
	ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '@app/domains/user/user.entity';

@Component({
	selector: 'app-login-aliado',
	standalone: true,
	imports: [RouterModule, ReactiveFormsModule],
	templateUrl: './login-aliado.component.html',
	styleUrl: './login-aliado.component.scss',
})
export class LoginAliadoComponent {
	private fb = inject(FormBuilder);
	private authService = inject(AuthService);
	private router = inject(Router);

	public loading = false;
	public errorMessage: string | null = null;

	public form: FormGroup = this.fb.group({
		email: ['', [Validators.required, Validators.email]],
		password: ['', [Validators.required]],
	});

	submit() {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		this.loading = true;
		this.errorMessage = null;
		const payload = this.form.value;

		this.authService.loginOrganization(payload).subscribe({
			next: (res: any) => {
				if (res && res.accessToken && res.user) {
					this.authService.setSession({
						accessToken: res.accessToken,
						user: res.user,
					});
					this.redirectByRole(res.user);
				} else if (res && res.user) {
					this.authService.setSession({
						accessToken: res.token || '',
						user: res.user,
					});
					this.redirectByRole(res.user);
				} else {
					const user: User = res as User;
					this.authService.setSession({ accessToken: res.token || '', user });
					this.redirectByRole(user);
				}
				this.loading = false;
			},
			error: (err) => {
				console.error('Login aliado error', err);
				const msg = err.error?.message || err.message;
				if (msg && msg !== 'Invalid credentials') {
					this.errorMessage = msg;
				} else {
					this.errorMessage =
						'Credenciales incorrectas. Verifique su correo y contraseña corporativa.';
				}
				this.loading = false;
			},
		});
	}

	private redirectByRole(user: User) {
		if (!user || !user.roles || !user.roles.length) {
			this.router.navigate(['/']);
			return;
		}
		const role = user.roles[0];
		if (role === 'ADMIN') {
			this.router.navigate(['/dashboard/admin']);
		} else if (role === 'PROVIDER') {
			this.router.navigate(['/dashboard/provider']);
		} else if (role === 'PATIENT') {
			this.router.navigate(['/dashboard/patient']);
		} else if (role === 'ORGANIZATION') {
			this.router.navigate(['/dashboard/organization']);
		} else {
			this.router.navigate(['/']);
		}
	}
}
