import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DatesSetArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import {
  GetProviderLabsDashboardResponse,
  LabsDashboardService,
  ProviderLabDashboardRow,
  ProviderLabStatus,
} from '@app/core/services/labs-dashboard.service';
import { ProgramLabProviderComponent } from '../program-lab-provider/program-lab-provider.component';

@Component({
  selector: 'app-labs-provider',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule, ProgramLabProviderComponent],
  templateUrl: './labs-provider.component.html',
  styleUrl: './labs-provider.component.scss',
})
export class LabsProviderComponent implements OnInit, OnDestroy {
  private readonly labsDashboardService = inject(LabsDashboardService);

  loading = false;
  errorMessage = '';

  searchTerm = '';
  statusFilter: 'ALL' | ProviderLabStatus = 'ALL';
  selectedDate = this.toDateKey(new Date());
  visibleMonth = this.toMonthKey(new Date());
  isProgramModalOpen = false;

  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  dashboard: GetProviderLabsDashboardResponse = {
    date: this.selectedDate,
    month: this.visibleMonth,
    scope: 'SELF',
    selectedProviderId: null,
    rows: [],
    calendarDays: [],
    stats: {
      labsScheduled: 0,
      samplesInTake: 0,
      withoutValidation: 0,
      totalMonthAppointments: 0,
    },
  };

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: esLocale,
    headerToolbar: {
      left: 'prev',
      center: 'title',
      right: 'next',
    },
    contentHeight: 300,
    fixedWeekCount: false,
    showNonCurrentDates: true,
    editable: false,
    selectable: false,
    events: [],
    dateClick: (arg) => this.onCalendarDateClick(arg),
    datesSet: (arg) => this.onCalendarDatesSet(arg),
  };

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  get rows(): ProviderLabDashboardRow[] {
    return this.dashboard.rows;
  }

  get hasContent(): boolean {
    return this.dashboard.stats.totalMonthAppointments > 0;
  }

  trackByRow(_: number, row: ProviderLabDashboardRow): string {
    return row.appointmentId;
  }

  formatDate(dateIso: string): string {
    const date = new Date(`${dateIso}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatTime(dateIso: string): string {
    const date = new Date(dateIso);
    if (Number.isNaN(date.getTime())) {
      return '--:--';
    }

    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  getDocumentLabel(row: ProviderLabDashboardRow): string {
    if (!row.patientDocumentNumber) {
      return 'Sin identificacion';
    }

    return [row.patientDocumentType, row.patientDocumentNumber]
      .filter(Boolean)
      .join(' ');
  }

  getStatusBadgeClass(status: ProviderLabStatus): string {
    switch (status) {
      case 'SIN_VALIDAR':
        return 'badge bg-amber-50 text-amber-600 border-amber-200';
      case 'TOMA':
        return 'badge bg-primary text-white border-primary';
      case 'PROCESADO':
        return 'badge bg-green-50 text-green-600 border-green-200';
      case 'PREELIMINAR':
        return 'badge bg-purple-50 text-purple-600 border-purple-200';
      default:
        return 'badge bg-slate-100 text-slate-500 border-slate-200';
    }
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.loadDashboard();
    }, 350);
  }

  onStatusFilterChange(value: 'ALL' | ProviderLabStatus): void {
    this.statusFilter = value;
    this.loadDashboard();
  }

  onDateInputChange(value: string): void {
    this.selectedDate = value;
    this.loadDashboard();
  }

  openProgramModal(): void {
    this.isProgramModalOpen = true;
  }

  closeProgramModal(): void {
    this.isProgramModalOpen = false;
  }

  private onCalendarDateClick(arg: DateClickArg): void {
    this.selectedDate = arg.dateStr;
    this.loadDashboard();
  }

  private onCalendarDatesSet(arg: DatesSetArg): void {
    const newMonth = this.toMonthKey(arg.view.currentStart);
    if (newMonth === this.visibleMonth) {
      return;
    }

    this.visibleMonth = newMonth;
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.labsDashboardService
      .getProviderDashboard({
        date: this.selectedDate,
        month: this.visibleMonth,
        search: this.searchTerm.trim() || undefined,
        status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
      })
      .subscribe({
        next: (response) => {
          this.dashboard = response;
          this.selectedDate = response.date;
          this.visibleMonth = response.month;
          this.updateCalendarMarkers(response.calendarDays);
          this.loading = false;
        },
        error: () => {
          this.dashboard = {
            date: this.selectedDate,
            month: this.visibleMonth,
            scope: 'SELF',
            selectedProviderId: null,
            rows: [],
            calendarDays: [],
            stats: {
              labsScheduled: 0,
              samplesInTake: 0,
              withoutValidation: 0,
              totalMonthAppointments: 0,
            },
          };
          this.updateCalendarMarkers([]);
          this.errorMessage =
            'No fue posible cargar la informacion de laboratorios en este momento.';
          this.loading = false;
        },
      });
  }

  private updateCalendarMarkers(days: { date: string; appointments: number }[]): void {
    const events: EventInput[] = days.map((day) => ({
      id: day.date,
      date: day.date,
      title: `${day.appointments}`,
      allDay: true,
      classNames: ['provider-day-event'],
    }));

    this.calendarOptions = {
      ...this.calendarOptions,
      events,
    };
  }

  private toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private toMonthKey(date: Date): string {
    return date.toISOString().slice(0, 7);
  }

}
