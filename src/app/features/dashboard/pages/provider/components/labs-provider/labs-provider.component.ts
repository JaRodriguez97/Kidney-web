import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import {
  CalendarOptions,
  DatesSetArg,
  DateSelectArg,
  EventInput,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import {
  GetProviderLabsDashboardResponse,
  LabResultDetailResponse,
  LabResultValueFlag,
  LabsDashboardService,
  ProviderLabDashboardRow,
  ProviderLabStatus,
  RegisterLabResultRequest,
} from '@app/core/services/labs-dashboard.service';
import {
  AppointmentService,
  ProviderAppointmentStatusAction,
} from '@app/core/services/appointment.service';
import { ProgramLabProviderComponent } from '../program-lab-provider/program-lab-provider.component';
import {
  formatColombiaDate,
  formatColombiaTime,
  toColombiaDateKey,
  toColombiaMonthKey,
} from '@app/shared/utils/colombia-date.utils';
import { catchError, forkJoin, of } from 'rxjs';

interface EditableResultValue {
  fieldName: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: '' | LabResultValueFlag;
}

@Component({
  selector: 'app-labs-provider',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule,
    ProgramLabProviderComponent,
  ],
  templateUrl: './labs-provider.component.html',
  styleUrl: './labs-provider.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LabsProviderComponent implements OnInit, OnDestroy {
  private readonly labsDashboardService = inject(LabsDashboardService);
  private readonly appointmentService = inject(AppointmentService);

  loading = false;
  errorMessage = '';

  searchTerm = '';
  statusFilter: 'ALL' | ProviderLabStatus = 'ALL';
  selectedDate = this.toDateKey(new Date());
  selectedRangeStart: string | null = null;
  selectedRangeEnd: string | null = null;
  visibleMonth = this.toMonthKey(new Date());
  isProgramModalOpen = false;
  registerResultRow: ProviderLabDashboardRow | null = null;
  updatingRows = new Set<string>();
  registerRows: EditableResultValue[] = [this.createResultRow()];
  registerNotes = '';
  registerSaving = false;
  registerErrorMessage = '';
  resultDetail: LabResultDetailResponse | null = null;
  resultDetailLoading = false;
  resultDetailError = '';

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
    selectable: true,
    events: [],
    select: (arg) => this.onCalendarRangeSelect(arg),
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
    return formatColombiaDate(`${dateIso}T00:00:00`);
  }

  formatTime(dateIso: string): string {
    const formatted = formatColombiaTime(dateIso);
    return formatted === '-' ? '--:--' : formatted;
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
    this.selectedRangeStart = null;
    this.selectedRangeEnd = null;
    this.loadDashboard();
  }

  openProgramModal(): void {
    this.isProgramModalOpen = true;
  }

  closeProgramModal(): void {
    this.isProgramModalOpen = false;
  }

  openRegisterResultModal(row: ProviderLabDashboardRow): void {
    this.registerResultRow = row;
    this.registerRows = [this.createResultRow()];
    this.registerNotes = '';
    this.registerErrorMessage = '';
  }

  closeRegisterResultModal(reload = false): void {
    if (this.registerSaving) {
      return;
    }

    this.registerResultRow = null;
    this.registerRows = [this.createResultRow()];
    this.registerNotes = '';
    this.registerErrorMessage = '';

    if (reload) {
      this.loadDashboard();
    }
  }

  addRegisterRow(): void {
    this.registerRows = [...this.registerRows, this.createResultRow()];
  }

  removeRegisterRow(index: number): void {
    if (this.registerRows.length === 1) {
      this.registerRows = [this.createResultRow()];
      return;
    }

    this.registerRows = this.registerRows.filter(
      (_, currentIndex) => currentIndex !== index,
    );
  }

  saveRegisterResult(): void {
    if (!this.registerResultRow) {
      return;
    }

    const normalizedRows = this.registerRows
      .map((row) => ({
        fieldName: row.fieldName.trim(),
        value: row.value.trim(),
        unit: row.unit.trim() || null,
        referenceRange: row.referenceRange.trim() || null,
        flag: row.flag || null,
      }))
      .filter((row) => row.fieldName.length > 0 && row.value.length > 0);

    if (!normalizedRows.length) {
      this.registerErrorMessage =
        'Agrega al menos un resultado con campo y valor para guardar.';
      return;
    }

    const payload: RegisterLabResultRequest = {
      resultValues: normalizedRows,
      notes: this.registerNotes.trim() || undefined,
    };

    this.registerSaving = true;
    this.registerErrorMessage = '';

    this.labsDashboardService
      .registerResult(this.registerResultRow.appointmentId, payload)
      .subscribe({
        next: () => {
          this.registerSaving = false;
          this.closeRegisterResultModal(true);
        },
        error: () => {
          this.registerSaving = false;
          this.registerErrorMessage =
            'No fue posible registrar el resultado del laboratorio en este momento.';
        },
      });
  }

  getPrimaryActionLabel(row: ProviderLabDashboardRow): string {
    switch (row.status) {
      case 'SIN_VALIDAR':
        return 'Llamar';
      case 'TOMA':
        return 'Iniciar Procesamiento';
      case 'PROCESADO':
        return 'Registrar Resultado';
      case 'PREELIMINAR':
        return row.resultStatus === 'DRAFT'
          ? 'Enviar a Validación'
          : 'Ver Resultado';
      default:
        return 'Sin acción';
    }
  }

  getPrimaryActionClass(row: ProviderLabDashboardRow): string {
    switch (row.status) {
      case 'SIN_VALIDAR':
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      case 'TOMA':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'PROCESADO':
        return 'bg-primary text-white border-primary hover:bg-primary/90';
      case 'PREELIMINAR':
        return row.resultStatus === 'DRAFT'
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
          : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  }

  isActionDisabled(row: ProviderLabDashboardRow): boolean {
    return row.status === 'CANCELADO' || this.updatingRows.has(row.appointmentId);
  }

  onPrimaryAction(row: ProviderLabDashboardRow): void {
    if (row.status === 'SIN_VALIDAR') {
      this.advanceLabStatus(row.appointmentId, 'CALL');
      return;
    }

    if (row.status === 'TOMA') {
      this.advanceLabStatus(row.appointmentId, 'START');
      return;
    }

    if (row.status === 'PROCESADO') {
      this.openRegisterResultModal(row);
      return;
    }

    if (row.status === 'PREELIMINAR') {
      if (row.resultStatus === 'DRAFT') {
        this.submitForValidation(row.appointmentId);
        return;
      }

      this.openResultDetail(row.appointmentId);
    }
  }

  canDownloadPdf(row: ProviderLabDashboardRow): boolean {
    return row.resultStatus === 'PUBLISHED';
  }

  onDownloadPdf(appointmentId: string): void {
    this.labsDashboardService.downloadResultPdf(appointmentId).subscribe({
      next: (blob) => {
        const fileName = `resultado-laboratorio-${appointmentId}.pdf`;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage =
          'No fue posible descargar el PDF del resultado en este momento.';
      },
    });
  }

  closeResultDetail(): void {
    this.resultDetail = null;
    this.resultDetailError = '';
  }

  private openResultDetail(appointmentId: string): void {
    this.resultDetailLoading = true;
    this.resultDetailError = '';
    this.resultDetail = null;

    this.labsDashboardService.getResultDetail(appointmentId).subscribe({
      next: (detail) => {
        this.resultDetail = detail;
        this.resultDetailLoading = false;
      },
      error: () => {
        this.resultDetailError =
          'No fue posible cargar el detalle del resultado en este momento.';
        this.resultDetailLoading = false;
      },
    });
  }

  private submitForValidation(appointmentId: string): void {
    this.updatingRows.add(appointmentId);
    this.labsDashboardService.submitResultForValidation(appointmentId).subscribe({
      next: () => {
        this.updatingRows.delete(appointmentId);
        this.loadDashboard();
      },
      error: () => {
        this.updatingRows.delete(appointmentId);
        this.errorMessage =
          'No fue posible enviar el resultado a validación en este momento.';
      },
    });
  }

  private advanceLabStatus(
    appointmentId: string,
    action: ProviderAppointmentStatusAction,
  ): void {
    this.updatingRows.add(appointmentId);

    this.appointmentService
      .updateProviderAppointmentStatus(appointmentId, { action })
      .subscribe({
        next: () => {
          this.updatingRows.delete(appointmentId);
          this.loadDashboard();
        },
        error: () => {
          this.updatingRows.delete(appointmentId);
          this.errorMessage =
            'No fue posible actualizar el estado del laboratorio en este momento.';
        },
      });
  }

  private onCalendarDateClick(arg: DateClickArg): void {
    this.selectedDate = arg.dateStr;
    this.selectedRangeStart = this.selectedDate;
    this.selectedRangeEnd = this.selectedDate;
    this.loadDashboard();
  }

  private onCalendarRangeSelect(arg: DateSelectArg): void {
    this.selectedRangeStart = arg.startStr;
    this.selectedRangeEnd = this.getInclusiveRangeEnd(arg.endStr);
    this.selectedDate = this.selectedRangeStart;
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

    if (this.selectedRangeStart && this.selectedRangeEnd) {
      this.loadDashboardByRange(this.selectedRangeStart, this.selectedRangeEnd);
      return;
    }

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

  private loadDashboardByRange(rangeStart: string, rangeEnd: string): void {
    const dateKeys = this.buildDateRange(rangeStart, rangeEnd);
    const rangeRequests = dateKeys.map((dateKey) =>
      this.labsDashboardService
        .getProviderDashboard({
          date: dateKey,
          month: dateKey.slice(0, 7),
          search: this.searchTerm.trim() || undefined,
          status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
        })
        .pipe(catchError(() => of(null))),
    );

    const calendarRequest = this.labsDashboardService
      .getProviderDashboard({
        date: this.selectedDate,
        month: this.visibleMonth,
      })
      .pipe(catchError(() => of(null)));

    forkJoin({
      filteredRange: forkJoin(rangeRequests),
      calendar: calendarRequest,
    }).subscribe({
      next: ({ filteredRange, calendar }) => {
        const validResponses = filteredRange.filter(
          (response): response is GetProviderLabsDashboardResponse => !!response,
        );

        if (!validResponses.length) {
          this.dashboard = {
            date: rangeStart,
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
          this.updateCalendarMarkers(calendar?.calendarDays ?? []);
          this.errorMessage =
            'No fue posible cargar la informacion de laboratorios en este momento.';
          this.loading = false;
          return;
        }

        const mergedRows = this.uniqueRowsByAppointment(
          validResponses.flatMap((response) => response.rows),
        ).sort((a, b) => {
          const dateCmp = a.scheduledDate.localeCompare(b.scheduledDate);
          if (dateCmp !== 0) {
            return dateCmp;
          }

          return a.startTime.localeCompare(b.startTime);
        });

        this.dashboard = {
          date: rangeStart,
          month: rangeStart.slice(0, 7),
          scope: validResponses[0].scope,
          selectedProviderId: validResponses[0].selectedProviderId,
          rows: mergedRows,
          calendarDays: calendar?.calendarDays ?? [],
          stats: {
            labsScheduled: mergedRows.filter((row) => row.status !== 'CANCELADO')
              .length,
            samplesInTake: mergedRows.filter((row) => row.status === 'TOMA')
              .length,
            withoutValidation: mergedRows.filter(
              (row) => row.status === 'SIN_VALIDAR',
            ).length,
            totalMonthAppointments:
              calendar?.stats.totalMonthAppointments ??
              validResponses[0].stats.totalMonthAppointments,
          },
        };

        this.selectedDate = rangeStart;
        this.visibleMonth = rangeStart.slice(0, 7);
        this.updateCalendarMarkers(calendar?.calendarDays ?? []);
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
    return toColombiaDateKey(date);
  }

  private toMonthKey(date: Date): string {
    return toColombiaMonthKey(date);
  }

  private buildDateRange(start: string, end: string): string[] {
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    const range: string[] = [];

    for (
      let cursor = new Date(startDate);
      cursor <= endDate;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      range.push(this.toDateKey(cursor));
    }

    return range;
  }

  private getInclusiveRangeEnd(exclusiveEnd: string): string {
    const endDate = new Date(`${exclusiveEnd}T00:00:00`);
    endDate.setDate(endDate.getDate() - 1);
    return this.toDateKey(endDate);
  }

  private uniqueRowsByAppointment(
    rows: ProviderLabDashboardRow[],
  ): ProviderLabDashboardRow[] {
    const map = new Map<string, ProviderLabDashboardRow>();
    for (const row of rows) {
      map.set(row.appointmentId, row);
    }

    return [...map.values()];
  }

  private createResultRow(): EditableResultValue {
    return {
      fieldName: '',
      value: '',
      unit: '',
      referenceRange: '',
      flag: '',
    };
  }

}
