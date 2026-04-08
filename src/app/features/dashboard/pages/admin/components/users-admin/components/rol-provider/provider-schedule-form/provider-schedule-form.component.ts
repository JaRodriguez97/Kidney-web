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
		slotIntervalMinutes: number;
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
	showScheduleSection = false;
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

	slotOptions = [
		{ value: 15, label: '15 min' },
		{ value: 20, label: '20 min' },
		{ value: 30, label: '30 min' },
		{ value: 45, label: '45 min' },
		{ value: 60, label: '60 min' },
	];

	@Output() scheduleDataChange = new EventEmitter<ScheduleFormData | null>();

	constructor(
		private fb: FormBuilder,
		private clinicBranchService: ClinicBranchService,
	) {}

	ngOnInit(): void {
		this.initializeForm();
		this.loadClinicBranches();
	}

	initializeForm(): void {
		this.scheduleForm = this.fb.group({
			enableSchedule: [false],
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
			endDate: [''],
			// 7 FormGroups fijos, uno por día de la semana
			day0: this.createDayGroup(true, '08:00', '17:00', 30),
			day1: this.createDayGroup(true, '08:00', '17:00', 30),
			day2: this.createDayGroup(true, '08:00', '17:00', 30),
			day3: this.createDayGroup(true, '08:00', '17:00', 30),
			day4: this.createDayGroup(true, '08:00', '17:00', 30),
			day5: this.createDayGroup(false, '08:00', '12:00', 30),
			day6: this.createDayGroup(false, '08:00', '12:00', 30),
		});

		this.scheduleForm.valueChanges.subscribe(() => {
			if (this.showScheduleSection) {
				this.emitScheduleData();
			} else {
				this.scheduleDataChange.emit(null);
			}
		});

		this.scheduleForm
			.get('enableSchedule')
			?.valueChanges.subscribe((enabled) => {
				this.showScheduleSection = enabled;
				if (!enabled) {
					this.scheduleDataChange.emit(null);
				}
			});
	}

	private createDayGroup(
		enabled: boolean,
		startTime: string,
		endTime: string,
		slotInterval: number,
	): FormGroup {
		return this.fb.group({
			enabled: [enabled],
			startTime: [startTime, [Validators.required]],
			endTime: [endTime, [Validators.required]],
			slotIntervalMinutes: [slotInterval, [Validators.required]],
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
				slotIntervalMinutes: source.slotIntervalMinutes,
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
		const blocks = this.days
			.filter((day) => formValue[`day${day.value}`]?.enabled)
			.map((day) => {
				const dayVal = formValue[`day${day.value}`];
				return {
					dayOfWeek: day.value,
					startTime: dayVal.startTime,
					endTime: dayVal.endTime,
					slotIntervalMinutes: dayVal.slotIntervalMinutes,
					maxOverbook: 0,
				};
			});

		if (blocks.length === 0) return null;

		return {
			clinicBranchId: formValue.clinicBranchId,
			name: formValue.name,
			startDate: formValue.startDate,
			endDate: formValue.endDate || undefined,
			availabilityBlocks: blocks,
		};
	}

	getScheduleData(): ScheduleFormData | null {
		if (!this.showScheduleSection) return null;
		return this.buildScheduleData();
	}

	resetForm(): void {
		this.scheduleForm.reset({ enableSchedule: false });
		for (const day of this.days) {
			this.getDayGroup(day.value).patchValue({
				enabled: day.value <= 4,
				startTime: '08:00',
				endTime: day.value <= 4 ? '17:00' : '12:00',
				slotIntervalMinutes: 30,
			});
		}
	}
}
