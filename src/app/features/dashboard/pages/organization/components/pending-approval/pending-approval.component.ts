import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrganizationService } from '@app/core/services/organization.service';
import { AuthService } from '@app/features/auth/services/auth.service';

@Component({
  selector: 'app-pending-approval',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 p-6">
      <div class="max-w-lg w-full">

        <!-- Card principal -->
        <div class="glass-panel p-10 text-center space-y-6 animate-fadeIn">

          <!-- Icono animado -->
          <div class="flex justify-center">
            <div class="relative w-24 h-24">
              <div class="absolute inset-0 rounded-full bg-amber-100 animate-ping opacity-40"></div>
              <div class="relative flex items-center justify-center w-24 h-24 rounded-full bg-amber-50 border-2 border-amber-200 shadow-lg shadow-amber-100">
                <span class="material-symbols-outlined text-5xl text-amber-500">hourglass_top</span>
              </div>
            </div>
          </div>

          <!-- Título y descripción -->
          <div class="space-y-3">
            <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">
              Solicitud en Revisión
            </h1>
            <p class="text-slate-500 text-sm leading-relaxed">
              Tu solicitud de acceso como aliado está siendo revisada por nuestro equipo
              administrativo. Este proceso puede tomar hasta <strong class="text-slate-700">24–48 horas hábiles</strong>.
            </p>
          </div>

          <!-- Estado actual -->
          <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-2">
            <div class="flex items-center gap-2 text-amber-700 font-semibold text-sm">
              <span class="material-symbols-outlined text-base">info</span>
              Estado actual de tu solicitud
            </div>
            <div class="flex items-center gap-3 mt-2">
              <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
                <span class="text-xs text-amber-800 font-medium">{{ statusLabel }}</span>
              </div>
            </div>
          </div>

          <!-- Pasos del proceso -->
          <div class="text-left space-y-3">
            <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Proceso de aprobación</p>
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span class="material-symbols-outlined text-xs text-green-600">check</span>
                </div>
                <span class="text-sm text-slate-600">Solicitud recibida</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <span class="material-symbols-outlined text-xs text-amber-600">more_horiz</span>
                </div>
                <span class="text-sm text-slate-600">Verificación de documentos e información</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span class="material-symbols-outlined text-xs text-slate-400">lock</span>
                </div>
                <span class="text-sm text-slate-400">Activación de cuenta y acceso completo</span>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex flex-col gap-3 pt-2">
            <button
              (click)="checkStatus()"
              [disabled]="isChecking"
              class="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span
                class="material-symbols-outlined text-base"
                [class.animate-spin]="isChecking"
              >{{ isChecking ? 'refresh' : 'sync' }}</span>
              {{ isChecking ? 'Verificando...' : 'Verificar estado' }}
            </button>
            <button
              (click)="logout()"
              class="w-full py-2.5 rounded-xl font-semibold text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>

        </div>

        <!-- Footer -->
        <p class="text-center text-xs text-slate-400 mt-6">
          ¿Tienes preguntas? Escríbenos a
          <a href="mailto:soporte@kidneymedicine.com" class="text-primary hover:underline">
            soporte&#64;kidneymedicine.com
          </a>
        </p>

      </div>
    </div>
  `,
})
export class PendingApprovalComponent implements OnInit {
  private router = inject(Router);
  private organizationService = inject(OrganizationService);
  private auth = inject(AuthService);

  statusLabel = 'Pendiente de revisión';
  isChecking = false;

  ngOnInit(): void {
    const status = this.auth.currentUser?.status ?? '';
    this.statusLabel = this.resolveLabel(status);
  }

  checkStatus(): void {
    this.isChecking = true;
    this.organizationService.getProfile().subscribe({
      next: (profile: any) => {
        const status: string = profile?.status ?? profile?.data?.status ?? '';
        this.statusLabel = this.resolveLabel(status);
        this.isChecking = false;

        const pending = new Set(['SUBMITTED', 'UNDER_REVIEW', 'PENDING']);
        if (!pending.has(status)) {
          // Status changed to ACTIVE → navigate to dashboard home
          const stored = this.auth.currentUser;
          if (stored) {
            this.auth.setSession({
              accessToken: localStorage.getItem('accessToken') ?? '',
              user: { ...stored, status },
            });
          }
          this.router.navigate(['organization', 'home']);
        }
      },
      error: () => {
        this.isChecking = false;
      },
    });
  }

  logout(): void {
    this.auth.clearSession();
    this.router.navigate(['/login/organization']);
  }

  private resolveLabel(status: string): string {
    const labels: Record<string, string> = {
      SUBMITTED: 'Solicitud enviada — en cola de revisión',
      UNDER_REVIEW: 'En revisión por el equipo administrativo',
      PENDING: 'Pendiente de aprobación',
    };
    return labels[status] ?? 'Pendiente de revisión';
  }
}
