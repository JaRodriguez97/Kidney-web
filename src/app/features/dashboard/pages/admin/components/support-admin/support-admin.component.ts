import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SupportService,
  SupportTicketDetail,
  SupportTicketStatus,
  SupportTicketCategory,
} from '@app/core/services/support.service';
import { formatColombiaDate } from '@app/shared/utils/colombia-date.utils';

@Component({
  selector: 'app-support-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support-admin.component.html',
  styleUrl: './support-admin.component.scss',
})
export class SupportAdminComponent implements OnInit {
  private readonly supportService = inject(SupportService);

  tickets: SupportTicketDetail[] = [];
  totalTickets = 0;
  loading = false;
  errorMessage = '';

  // Filters
  filterStatus = '';
  filterCategory = '';
  searchQuery = '';

  // Selected ticket modal / panel
  selectedTicket: SupportTicketDetail | null = null;
  replyMessageText = '';
  sendingReply = false;
  replySuccessMessage = '';
  replyErrorMessage = '';

  statusUpdating = false;

  readonly statusOptions: { label: string; value: SupportTicketStatus }[] = [
    { label: 'Pendiente', value: 'PENDING' },
    { label: 'En Revisión', value: 'IN_REVIEW' },
    { label: 'Resuelto', value: 'RESOLVED' },
    { label: 'Cerrado', value: 'CLOSED' },
  ];

  readonly categoryOptions: { label: string; value: SupportTicketCategory }[] = [
    { label: 'Plataforma', value: 'PLATFORM' },
    { label: 'Conectividad', value: 'CONNECTIVITY' },
    { label: 'Equipos', value: 'EQUIPMENT' },
    { label: 'Otros', value: 'OTHER' },
  ];

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;
    this.errorMessage = '';

    this.supportService
      .listAllTicketsAdmin({
        status: this.filterStatus || undefined,
        category: this.filterCategory || undefined,
        search: this.searchQuery || undefined,
        page: 1,
        limit: 50,
      })
      .subscribe({
        next: (res) => {
          this.tickets = res.tickets;
          this.totalTickets = res.total;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = 'Error al cargar listado de tickets de soporte';
          this.loading = false;
        },
      });
  }

  openTicketDetails(ticket: SupportTicketDetail): void {
    this.selectedTicket = ticket;
    this.replyMessageText = '';
    this.replySuccessMessage = '';
    this.replyErrorMessage = '';

    // Fetch details with complete message conversation
    this.supportService.getTicketMessages(ticket.id).subscribe({
      next: (detail) => {
        this.selectedTicket = detail;
      },
      error: (err) => {
        // Keep initial details if request fails
      },
    });
  }

  closeTicketDetails(): void {
    this.selectedTicket = null;
  }

  onSendReply(): void {
    if (!this.selectedTicket || !this.replyMessageText.trim()) return;

    this.sendingReply = true;
    this.replyErrorMessage = '';
    this.replySuccessMessage = '';

    this.supportService
      .respondTicket(this.selectedTicket.id, this.replyMessageText.trim())
      .subscribe({
        next: (msg) => {
          this.sendingReply = false;
          this.replySuccessMessage = 'Respuesta enviada exitosamente';
          this.replyMessageText = '';
          if (this.selectedTicket) {
            if (!this.selectedTicket.messages) this.selectedTicket.messages = [];
            this.selectedTicket.messages.push(msg);
          }
          this.loadTickets();
        },
        error: () => {
          this.sendingReply = false;
          this.replyErrorMessage = 'No fue posible enviar la respuesta al ticket';
        },
      });
  }

  onChangeStatus(newStatus: SupportTicketStatus): void {
    if (!this.selectedTicket) return;

    this.statusUpdating = true;
    this.supportService
      .updateTicketStatus(this.selectedTicket.id, newStatus)
      .subscribe({
        next: (updated) => {
          this.statusUpdating = false;
          if (this.selectedTicket) {
            this.selectedTicket.status = updated.status;
            this.selectedTicket.resolvedAt = updated.resolvedAt;
          }
          this.loadTickets();
        },
        error: () => {
          this.statusUpdating = false;
        },
      });
  }

  getStatusBadgeClass(status: SupportTicketStatus): string {
    switch (status) {
      case 'PENDING':
        return 'badge-pending';
      case 'IN_REVIEW':
        return 'badge-in-review';
      case 'RESOLVED':
        return 'badge-resolved';
      case 'CLOSED':
        return 'badge-closed';
      default:
        return '';
    }
  }

  getStatusLabel(status: SupportTicketStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'IN_REVIEW':
        return 'En Revisión';
      case 'RESOLVED':
        return 'Resuelto';
      case 'CLOSED':
        return 'Cerrado';
      default:
        return status;
    }
  }

  getCategoryLabel(category?: string): string {
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
        return category || 'General';
    }
  }

  getInitials(name?: string): string {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  formatDate(dateStr?: string | Date | null): string {
    if (!dateStr) return 'N/A';
    return formatColombiaDate(dateStr);
  }
}
