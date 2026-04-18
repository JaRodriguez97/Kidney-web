import {
	Component,
	OnInit,
	Output,
	EventEmitter,
	OnDestroy,
	Inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
	ClinicBranchService,
	ClinicBranchResponse,
} from '@core/services/clinic-branch.service';

export interface ScheduleFormData {
	clinicBranchId: string;
	name: string;
	startDate: string;
	endDate?: string;
	availabilityBlocks: Array<{
		dayOfWeek: number;
		startTime: string;
		endTime: string;
		maxOverbook?: number;
	}>;
}

interface DayRow {
	value: number;
	label: string;
	shortLabel: string;
}

@Component({
	selector: 'app-provider-schedule-form',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './provider-schedule-form.component.html',
	styleUrl: './provider-schedule-form.component.scss',
})
export class ProviderScheduleFormComponent implements OnInit, OnDestroy {
	scheduleForm!: FormGroup;
	showScheduleSection = true;
	clinicBranches: ClinicBranchResponse[] = [];
	private destroy$ = new Subject<void>();

	days: DayRow[] = [
		{ value: 0, label: 'Lunes', shortLabel: 'Lun' },
		{ value: 1, label: 'Martes', shortLabel: 'Mar' },
		{ value: 2, label: 'Miércoles', shortLabel: 'Mié' },
		{ value: 3, label: 'Jueves', shortLabel: 'Jue' },
		{ value: 4, label: 'Viernes', shortLabel: 'Vie' },
		{ value: 5, label: 'Sábado', shortLabel: 'Sáb' },
		{ value: 6, label: 'Domingo', shortLabel: 'Dom' },
	];

	@Output() scheduleDataChange = new EventEmitter<ScheduleFormData | null>();

	constructor(
		private fb: FormBuilder,
		private clinicBranchService: ClinicBranchService,
	) {}

	private toMinutes(value: string | null | undefined): number | null {
		if (!value || !/^\d{2}:\d{2}$/.test(value)) {
			return null;
		}

		const [hours, minutes] = value.split(':').map(Number);
		return hours * 60 + minutes;
	}

	ngOnInit(): void {
		this.initializeForm();
		this.loadClinicBranches();
	}

	initializeForm(): void {
		this.scheduleForm = this.fb.group({
			clinicBranchId: ['', [Validators.required]],
			name: [
				'',
				[
					Validators.required,
					Validators.minLength(1),
					Validators.maxLength(100),
				],
			],
			startDate: ['', [Validators.required]],
			endDate: ['', [Validators.required]],
			// 7 FormGroups fijos, uno por día de la semana
			day0: this.createDayGroup(true, '08:00', '17:00'),
			day1: this.createDayGroup(true, '08:00', '17:00'),
			day2: this.createDayGroup(true, '08:00', '17:00'),
			day3: this.createDayGroup(true, '08:00', '17:00'),
			day4: this.createDayGroup(true, '08:00', '17:00'),
			day5: this.createDayGroup(false, '08:00', '12:00'),
			day6: this.createDayGroup(false, '08:00', '12:00'),
		});

		this.scheduleForm.valueChanges.subscribe(() => {
			this.emitScheduleData();
		});
	}

	private createDayGroup(
		enabled: boolean,
		startTime: string,
		endTime: string,
	): FormGroup {
		return this.fb.group({
			enabled: [enabled],
			startTime: [startTime, [Validators.required]],
			endTime: [endTime, [Validators.required]],
		});
	}

	getDayGroup(dayIndex: number): FormGroup {
		return this.scheduleForm.get(`day${dayIndex}`) as FormGroup;
	}

	isDayEnabled(dayIndex: number): boolean {
		return this.getDayGroup(dayIndex).get('enabled')?.value ?? false;
	}

	get enabledDaysCount(): number {
		return this.days.filter((d) => this.isDayEnabled(d.value)).length;
	}

	get dateRangeError(): string | null {
		const startDate = this.scheduleForm?.get('startDate')?.value;
		const endDate = this.scheduleForm?.get('endDate')?.value;

		if (!startDate || !endDate) {
			return null;
		}

		const normalizedStartDate = new Date(`${startDate}T00:00:00`);
		const normalizedEndDate = new Date(`${endDate}T00:00:00`);

		if (
			Number.isNaN(normalizedStartDate.getTime()) ||
			Number.isNaN(normalizedEndDate.getTime())
		) {
			return 'Las fechas del horario no son válidas.';
		}

		if (normalizedStartDate > normalizedEndDate) {
			return 'La fecha de fin debe ser posterior o igual a la fecha de inicio.';
		}

		return null;
	}

	getDayValidationMessage(dayIndex: number): string | null {
		if (!this.isDayEnabled(dayIndex)) {
			return null;
		}

		const dayGroup = this.getDayGroup(dayIndex);
		const startTime = dayGroup.get('startTime')?.value;
		const endTime = dayGroup.get('endTime')?.value;

		const startMinutes = this.toMinutes(startTime);
		const endMinutes = this.toMinutes(endTime);

		if (startMinutes === null || endMinutes === null) {
			return 'Ingrese horas válidas para este día.';
		}

		if (startMinutes >= endMinutes) {
			return 'La hora de fin debe ser mayor a la hora de inicio.';
		}

		return null;
	}

	get hasInvalidEnabledDays(): boolean {
		return this.days.some((day) => !!this.getDayValidationMessage(day.value));
	}

	copyToAllDays(): void {
		const firstEnabled = this.days.find((d) => this.isDayEnabled(d.value));
		if (!firstEnabled) return;

		const source = this.getDayGroup(firstEnabled.value).value;
		for (const day of this.days) {
			if (day.value === firstEnabled.value) continue;
			const target = this.getDayGroup(day.value);
			target.patchValue({
				enabled: true,
				startTime: source.startTime,
				endTime: source.endTime,
			});
		}
	}

	loadClinicBranches(): void {
		this.clinicBranchService
			.getClinicBranches()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (branches: ClinicBranchResponse[]) => {
					this.clinicBranches = branches;
				},
				error: (err: any) => {
					console.error('Error al cargar sedes clínicas:', err);
					this.clinicBranches = [];
				},
			});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private emitScheduleData(): void {
		const data = this.buildScheduleData();
		this.scheduleDataChange.emit(data);
	}

	private buildScheduleData(): ScheduleFormData | null {
		const formValue = this.scheduleForm.value;

		if (
			!formValue.clinicBranchId ||
			!formValue.name ||
			!formValue.startDate ||
			!formValue.endDate
		) {
			return null;
		}

		if (this.dateRangeError) {
			return null;
		}

		const blocks = this.days
			.filter((day) => formValue[`day${day.value}`]?.enabled)
			.map((day) => {
				const dayVal = formValue[`day${day.value}`];
				return {
					dayOfWeek: day.value,
					startTime: dayVal.startTime,
					endTime: dayVal.endTime,
					maxOverbook: 0,
				};
			});

		if (blocks.length === 0) return null;
		if (this.hasInvalidEnabledDays) return null;

		return {
			clinicBranchId: formValue.clinicBranchId,
			name: formValue.name,
			startDate: formValue.startDate,
			endDate: formValue.endDate,
			availabilityBlocks: blocks,
		};
	}

	getScheduleData(): ScheduleFormData | null {
		return this.buildScheduleData();
	}

	resetForm(): void {
		this.scheduleForm.reset();
		for (const day of this.days) {
			this.getDayGroup(day.value).patchValue({
				enabled: day.value <= 4,
				startTime: '08:00',
				endTime: day.value <= 4 ? '17:00' : '12:00',
			});
		}
		this.scheduleDataChange.emit(null);
	}
}
