import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PlatformHealthItem,
  PlatformOperationalStatus,
  SupportService,
  SupportTicketCategory,
  SupportTicketListItem,
  SupportTicketStatus,
} from '@app/core/services/support.service';

@Component({
  selector: 'app-support-provider',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './support-provider.component.html',
  styleUrl: './support-provider.component.scss',
})
export class SupportProviderComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supportService = inject(SupportService);

  readonly categoryOptions: { label: string; value: SupportTicketCategory }[] = [
    { label: 'Plataforma', value: 'PLATFORM' },
    { label: 'Conectividad', value: 'CONNECTIVITY' },
    { label: 'Equipos', value: 'EQUIPMENT' },
    { label: 'Otros', value: 'OTHER' },
  ];

  readonly ticketForm = this.fb.nonNullable.group({
    subject: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(180)],
    }),
    category: this.fb.nonNullable.control<SupportTicketCategory>('PLATFORM', {
      validators: [Validators.required],
    }),
    description: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.minLength(20), Validators.maxLength(4000)],
    }),
  });

  selectedFile: File | null = null;

  submitting = false;
  submitErrorMessage = '';
  submitSuccessMessage = '';

  healthLoading = false;
  healthErrorMessage = '';
  platformStatusItems: PlatformHealthItem[] = [];

  recentTicketsLoading = false;
  recentTicketsErrorMessage = '';
  recentTickets: SupportTicketListItem[] = [];

  ngOnInit(): void {
    this.loadPlatformHealth();
    this.loadRecentTickets();
  }

  trackByTicket(_: number, ticket: SupportTicketListItem): string {
    return ticket.id;
  }

  onTicketSubmit(): void {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.submitErrorMessage = '';
    this.submitSuccessMessage = '';

    const payload = this.ticketForm.getRawValue();

    this.supportService
      .createTicket({
        subject: payload.subject,
        category: payload.category,
        description: payload.description,
        file: this.selectedFile ?? undefined,
      })
      .subscribe({
        next: () => {
          this.submitSuccessMessage =
            'Reporte enviado correctamente. Nuestro equipo revisara la incidencia.';
          this.ticketForm.reset({
            subject: '',
            category: 'PLATFORM',
            description: '',
          });
          this.selectedFile = null;
          this.loadRecentTickets();
          this.submitting = false;
        },
        error: (error) => {
          this.submitErrorMessage = this.extractErrorMessage(
            error,
            'No fue posible enviar el reporte en este momento.',
          );
          this.submitting = false;
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    if (!file) {
      this.selectedFile = null;
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.selectedFile = null;
      this.submitErrorMessage = 'El archivo supera el tamano maximo de 5MB.';
      input.value = '';
      return;
    }

    this.submitErrorMessage = '';
    this.selectedFile = file;
  }

  clearSelectedFile(input: HTMLInputElement): void {
    this.selectedFile = null;
    input.value = '';
  }

  retryPlatformHealth(): void {
    this.loadPlatformHealth();
  }

  retryRecentTickets(): void {
    this.loadRecentTickets();
  }

  isControlInvalid(controlName: 'subject' | 'description'): boolean {
    const control = this.ticketForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  getSubjectErrorMessage(): string {
    const control = this.ticketForm.controls.subject;
    if (control.hasError('required')) {
      return 'El asunto es obligatorio.';
    }
    if (control.hasError('minlength')) {
      return 'El asunto debe tener al menos 5 caracteres.';
    }
    if (control.hasError('maxlength')) {
      return 'El asunto no puede superar 180 caracteres.';
    }
    return 'Asunto invalido.';
  }

  getDescriptionErrorMessage(): string {
    const control = this.ticketForm.controls.description;
    if (control.hasError('required')) {
      return 'La descripcion es obligatoria.';
    }
    if (control.hasError('minlength')) {
      return 'La descripcion debe tener al menos 20 caracteres.';
    }
    if (control.hasError('maxlength')) {
      return 'La descripcion no puede superar 4000 caracteres.';
    }
    return 'Descripcion invalida.';
  }

  getStatusLabel(status: SupportTicketStatus): string {
    switch (status) {
      case 'PENDING':
        return 'PENDIENTE';
      case 'IN_REVIEW':
        return 'EN REVISION';
      case 'RESOLVED':
        return 'RESUELTO';
      case 'CLOSED':
        return 'CERRADO';
      default:
        return status;
    }
  }

  getStatusBadgeClass(status: SupportTicketStatus): string {
    switch (status) {
      case 'PENDING':
        return 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase whitespace-nowrap';
      case 'IN_REVIEW':
        return 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase whitespace-nowrap';
      case 'RESOLVED':
        return 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase whitespace-nowrap';
      case 'CLOSED':
        return 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 uppercase whitespace-nowrap';
      default:
        return 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase whitespace-nowrap';
    }
  }

  getHealthDotClass(status: PlatformOperationalStatus): string {
    switch (status) {
      case 'OPERATIVE':
        return 'w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]';
      case 'DEGRADED':
        return 'w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]';
      case 'DOWN':
        return 'w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
      default:
        return 'w-2 h-2 rounded-full bg-slate-300';
    }
  }

  getHealthPillClass(status: PlatformOperationalStatus): string {
    switch (status) {
      case 'OPERATIVE':
        return 'text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase';
      case 'DEGRADED':
        return 'text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase';
      case 'DOWN':
        return 'text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase';
      default:
        return 'text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full uppercase';
    }
  }

  getHealthStatusLabel(status: PlatformOperationalStatus): string {
    switch (status) {
      case 'OPERATIVE':
        return 'Operativo';
      case 'DEGRADED':
        return 'Lento';
      case 'DOWN':
        return 'Caido';
      default:
        return 'Sin datos';
    }
  }

  getCategoryLabel(category: SupportTicketCategory): string {
    switch (category) {
      case 'PLATFORM':
        return 'Plataforma';
      case 'CONNECTIVITY':
        return 'Conectividad';
      case 'EQUIPMENT':
        return 'Equipos';
      case 'OTHER':
        return 'Otros';
      default:
        return category;
    }
  }

  formatTicketDate(createdAt: string): string {
    const parsed = new Date(createdAt);
    if (Number.isNaN(parsed.getTime())) {
      return 'Fecha desconocida';
    }

    const now = Date.now();
    const diffMs = Math.max(0, now - parsed.getTime());
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 60) {
      return `Hace ${Math.max(1, diffMinutes)} min`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `Hace ${diffHours} horas`;
    }

    return parsed.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private loadPlatformHealth(): void {
    this.healthLoading = true;
    this.healthErrorMessage = '';

    this.supportService.getPlatformHealth().subscribe({
      next: (response) => {
        this.platformStatusItems = [
          response.serverCloud,
          response.applicationResponse,
          response.database,
        ];
        this.healthLoading = false;
      },
      error: (error) => {
        this.platformStatusItems = [];
        this.healthErrorMessage = this.extractErrorMessage(
          error,
          'No fue posible consultar el estado de la plataforma.',
        );
        this.healthLoading = false;
      },
    });
  }

  private loadRecentTickets(): void {
    this.recentTicketsLoading = true;
    this.recentTicketsErrorMessage = '';

    this.supportService.listMyTickets(3).subscribe({
      next: (response) => {
        this.recentTickets = response.tickets;
        this.recentTicketsLoading = false;
      },
      error: (error) => {
        this.recentTickets = [];
        this.recentTicketsErrorMessage = this.extractErrorMessage(
          error,
          'No fue posible cargar tus reportes recientes.',
        );
        this.recentTicketsLoading = false;
      },
    });
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    const responseError = error as {
      error?: { message?: string; details?: Array<{ message?: string }> };
      message?: string;
    };

    const firstValidationMessage = responseError?.error?.details?.[0]?.message;
    if (firstValidationMessage) {
      return firstValidationMessage;
    }

    if (responseError?.error?.message) {
      return responseError.error.message;
    }

    if (responseError?.message) {
      return responseError.message;
    }

    return fallback;
  }

}
