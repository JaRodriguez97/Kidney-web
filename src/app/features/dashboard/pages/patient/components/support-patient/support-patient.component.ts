import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  SupportService,
  SupportTicketCategory,
  SupportTicketListItem,
  SupportTicketDetail,
} from '@app/core/services/support.service';
import { formatColombiaDate } from '@app/shared/utils/colombia-date.utils';

@Component({
  selector: 'app-support-patient',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './support-patient.component.html',
  styleUrl: './support-patient.component.scss',
})
export class SupportPatientComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supportService = inject(SupportService);

  readonly categoryOptions: { label: string; value: SupportTicketCategory }[] = [
    { label: 'Plataforma / Portal', value: 'PLATFORM' },
    { label: 'Conectividad / Citas', value: 'CONNECTIVITY' },
    { label: 'Dispositivos', value: 'EQUIPMENT' },
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
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(4000)],
    }),
  });

  selectedFile: File | null = null;
  submitting = false;
  submitSuccessMessage = '';
  submitErrorMessage = '';

  recentTicketsLoading = false;
  recentTickets: SupportTicketListItem[] = [];

  selectedTicket: SupportTicketDetail | null = null;

  ngOnInit(): void {
    this.loadRecentTickets();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit(): void {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.submitSuccessMessage = '';
    this.submitErrorMessage = '';

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
          this.submitting = false;
          this.submitSuccessMessage = 'Tu reporte ha sido enviado. Te responderemos a la brevedad.';
          this.ticketForm.reset({ subject: '', category: 'PLATFORM', description: '' });
          this.selectedFile = null;
          this.loadRecentTickets();
        },
        error: () => {
          this.submitting = false;
          this.submitErrorMessage = 'No se pudo enviar el reporte. Por favor intenta de nuevo.';
        },
      });
  }

  loadRecentTickets(): void {
    this.recentTicketsLoading = true;
    this.supportService.listMyTickets(10).subscribe({
      next: (res) => {
        this.recentTickets = res.tickets;
        this.recentTicketsLoading = false;
      },
      error: () => {
        this.recentTicketsLoading = false;
      },
    });
  }

  openTicketDetails(ticketId: string): void {
    this.supportService.getTicketMessages(ticketId).subscribe({
      next: (detail) => {
        this.selectedTicket = detail;
      },
      error: () => {},
    });
  }

  closeTicketDetails(): void {
    this.selectedTicket = null;
  }

  formatDate(dateStr?: string | Date | null): string {
    if (!dateStr) return 'N/A';
    return formatColombiaDate(dateStr);
  }
}
