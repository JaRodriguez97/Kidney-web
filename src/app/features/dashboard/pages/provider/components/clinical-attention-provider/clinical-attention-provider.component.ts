import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, ElementRef, inject, Input } from '@angular/core';
import {
	FormBuilder,
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
	EngineFormAppointmentSession,
	EngineFormInstanceBlockResponse,
	EngineFormFieldType,
	EngineFormService,
	EngineFormRenderableBlock,
	SaveEngineFormResponseRequestItem,
} from '@app/core/services/engine-form.service';
import {
	LabsDashboardService,
	PatientLabResultRow,
} from '@app/core/services/labs-dashboard.service';
import {
	ClinicalRecordService,
	PatientRecentHistoryItem,
} from '@app/core/services/clinical-record.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { DynamicEngineFieldComponent } from './components/dynamic-engine-field/dynamic-engine-field.component';

interface ClinicalAttentionNavigationState {
	appointmentId?: string;
	patientId?: string;
	serviceId?: string;
	patientName?: string;
	patientAge?: number;
	patientDocumentType?: string;
	patientDocumentNumber?: string;
	providerName?: string;
	serviceName?: string;
	startedAt?: string;
}

@Component({
	selector: 'app-clinical-attention-provider',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, DynamicEngineFieldComponent],
	templateUrl: './clinical-attention-provider.component.html',
	styleUrl: './clinical-attention-provider.component.scss',
})
export class ClinicalAttentionProviderComponent implements OnInit, OnDestroy {
	private readonly router = inject(Router);
	private readonly route = inject(ActivatedRoute);
	private readonly fb = inject(FormBuilder);
	private readonly engineFormService = inject(EngineFormService);
	private readonly labsDashboardService = inject(LabsDashboardService);
	private readonly clinicalRecordService = inject(ClinicalRecordService);

	@Input() isEmbedded = false;
	@Input() activeTab: 'FORM' | 'HISTORY' | 'ORDERS' = 'FORM';

	appointmentId = '';
	patientId = '';
	serviceId = '';
	serviceName = 'Atencion clinica';

	patientName = 'Paciente en atencion';
	patientAge: number | null = null;
	patientDocumentType = '';
	patientDocumentNumber = '';
	bloodTypeLabel = 'No disponible';
	allergiesLabel = 'No reportadas';
	riskIntegralLabel = 'Pendiente';
	providerName = 'Profesional tratante';

	elapsedLabel = '00:00:00';
	actionFeedback = '';
	loadingForm = false;
	loadError = '';
	loadingPatientLabHistory = false;
	loadingRecentHistory = false;
	recentHistory: PatientRecentHistoryItem[] = [];
	attentionForm: FormGroup = this.fb.group({});
	patientLabHistory: PatientLabResultRow[] = [];

	dynamicBlocks: EngineFormRenderableBlock[] = [];
	private instanceId = '';
	private instanceBlockIdsByBlockId: Record<string, string> = {};
	private primaryDiagnosisFieldId: string | null = null;

	private attentionStartedAt = new Date();
	private timerHandle: ReturnType<typeof setInterval> | null = null;
	private feedbackTimerHandle: ReturnType<typeof setTimeout> | null = null;
	private bmiSubscriptions: Subscription[] = [];

	ngOnInit(): void {
		this.hydrateContext();
		void this.loadActiveFormSession();
		void this.loadRecentHistory();
	}

	ngOnDestroy(): void {
		if (this.timerHandle) {
			clearInterval(this.timerHandle);
			this.timerHandle = null;
		}

		if (this.feedbackTimerHandle) {
			clearTimeout(this.feedbackTimerHandle);
			this.feedbackTimerHandle = null;
		}

		for (const subscription of this.bmiSubscriptions) {
			subscription.unsubscribe();
		}
		this.bmiSubscriptions = [];
	}

	saveDraft(): void {
		void this.persistCurrentResponses(false);
	}

	finalizeAttention(): void {
		if (this.attentionForm.invalid) {
			this.attentionForm.markAllAsTouched();
			this.showFeedback(
				'Completa los campos obligatorios para finalizar la consulta.',
			);
			return;
		}

		void this.persistCurrentResponses(true);
	}

	isWideField(fieldType: EngineFormFieldType): boolean {
		return fieldType === 'TEXTAREA';
	}

	getFieldControl(fieldId: string): FormControl {
		const controlName = this.getControlName(fieldId);
		const control = this.attentionForm.get(controlName);

		if (control) {
			return control as FormControl;
		}

		const fallbackControl = this.fb.control('');
		this.attentionForm.addControl(controlName, fallbackControl);
		return fallbackControl;
	}

	private get totalFields(): number {
		return this.dynamicBlocks.reduce(
			(accumulator, block) => accumulator + block.fields.length,
			0,
		);
	}

	get hasPrimaryDiagnosis(): boolean {
		if (!this.primaryDiagnosisFieldId) return false;
		const controlName = this.getControlName(this.primaryDiagnosisFieldId);
		const value = this.attentionForm.get(controlName)?.value;
		return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
	}

	openOrder(type: 'formula' | 'labs' | 'referral' | 'incapacity'): void {
		if (!this.hasPrimaryDiagnosis) return;
		const primaryDiagnosisValue = (() => {
			if (!this.primaryDiagnosisFieldId) return '';
			return (
				(this.attentionForm.get(this.getControlName(this.primaryDiagnosisFieldId))
					?.value as string) ?? ''
			);
		})();

		void this.router.navigate(
			['/dashboard/provider/medical-order', type],
			{
				queryParams: {
					appointmentId: this.appointmentId,
					patientId: this.patientId,
					serviceId: this.serviceId,
					serviceName: this.serviceName,
					patientName: this.patientName,
					primaryDiagnosis: primaryDiagnosisValue,
				},
			},
		);
	}

	openClinicalRecord(): void {
		const url =
			'/dashboard/provider/clinical-record?patientName=' +
			encodeURIComponent(this.patientName);
		window.open(url, '_blank');
	}

	private async loadRecentHistory(): Promise<void> {
		if (!this.patientId) return;
		this.loadingRecentHistory = true;
		try {
			const items = await firstValueFrom(
				this.clinicalRecordService.getPatientRecentHistory(this.patientId, 5),
			);
			this.recentHistory = items;
		} catch {
			// Silenciamos el error — la tarjeta mostrará el estado vacío
		} finally {
			this.loadingRecentHistory = false;
		}
	}

	get patientIdentityLabel(): string {
		const parts = [this.patientDocumentType, this.patientDocumentNumber].filter(
			Boolean,
		);

		return parts.length > 0 ? parts.join(' ') : 'Identificacion no disponible';
	}

	get patientAgeLabel(): string {
		return this.patientAge === null
			? 'Edad no disponible'
			: `${this.patientAge} Años`;
	}

	get riskIntegralBadgeClasses(): string {
		switch (this.riskIntegralLabel) {
			case 'ALTO':
				return 'flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-lg border border-red-100 mt-0.5';
			case 'MODERADO':
				return 'flex items-center gap-1 text-orange-500 font-bold bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100 mt-0.5';
			case 'BAJO':
				return 'flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-lg border border-green-100 mt-0.5';
			default:
				return 'flex items-center gap-1 text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 mt-0.5';
		}
	}

	get riskIntegralIcon(): string {
		switch (this.riskIntegralLabel) {
			case 'ALTO':
				return 'priority_high';
			case 'BAJO':
				return 'verified';
			default:
				return 'warning';
		}
	}

	private hydrateContext(): void {
		const queryMap = this.route.snapshot.queryParamMap;
		this.appointmentId = queryMap.get('appointmentId') ?? '';
		this.patientId = queryMap.get('patientId') ?? '';
		this.serviceId = queryMap.get('serviceId') ?? '';
		this.serviceName = queryMap.get('serviceName') ?? this.serviceName;

		const currentNavigationState = (this.router.getCurrentNavigation()?.extras
			.state ?? {}) as ClinicalAttentionNavigationState;

		const historyState =
			(typeof history !== 'undefined'
				? (history.state as ClinicalAttentionNavigationState)
				: {}) ?? {};

		const context: ClinicalAttentionNavigationState = {
			...historyState,
			...currentNavigationState,
		};

		if (context.patientName) {
			this.patientName = context.patientName;
		}

		if (typeof context.patientAge === 'number') {
			this.patientAge = context.patientAge;
		}

		if (context.patientDocumentType) {
			this.patientDocumentType = context.patientDocumentType;
		}

		if (context.patientDocumentNumber) {
			this.patientDocumentNumber = context.patientDocumentNumber;
		}

		if (context.providerName) {
			this.providerName = context.providerName;
		}

		if (context.serviceName) {
			this.serviceName = context.serviceName;
		}

		if (context.startedAt) {
			const parsedStartAt = new Date(context.startedAt);
			if (!Number.isNaN(parsedStartAt.getTime())) {
				this.attentionStartedAt = parsedStartAt;
			}
		}
	}

	private async loadActiveFormSession(): Promise<void> {
		if (!this.appointmentId) {
			this.loadError =
				'No se encontró appointmentId en la navegación. Regresa a Agenda e inicia la atención desde la cita.';
			this.startElapsedTimer();
			return;
		}

		this.loadingForm = true;
		this.loadError = '';

		try {
			const session = await firstValueFrom(
				this.engineFormService.getActiveFormByAppointment(this.appointmentId),
			);

			this.applySessionContext(session);
			this.dynamicBlocks = session.template.activeVersion?.blocks ?? [];
			this.instanceId = session.instance.id;
			this.instanceBlockIdsByBlockId = Object.fromEntries(
				session.instance.blocks.map((block) => [block.blockId, block.id]),
			);

			this.buildFormFromSession(this.dynamicBlocks, session.instance.blocks);
			this.setupBmiAutoCalculation();

			if (this.hasLabResultsHistoryVisualBlock()) {
				await this.loadPatientLabHistory();
			}

			if (this.dynamicBlocks.length === 0) {
				this.loadError =
					'El template activo no tiene bloques configurados para renderizar.';
			}
		} catch (error: unknown) {
			const message =
				typeof error === 'object' &&
				error !== null &&
				'error' in error &&
				typeof (error as { error?: unknown }).error === 'object' &&
				(error as { error?: { message?: unknown } }).error !== null &&
				'message' in
					((error as { error?: { message?: unknown } }).error as {
						message?: unknown;
					})
					? String(
							(
								(error as { error?: { message?: unknown } }).error as {
									message?: unknown;
								}
							).message ?? 'No fue posible cargar el formulario de atención.',
						)
					: 'No fue posible cargar el formulario de atención.';

			this.loadError = message;
		} finally {
			this.loadingForm = false;
			this.startElapsedTimer();
		}
	}

	private applySessionContext(session: EngineFormAppointmentSession): void {
		this.patientId = session.patient.id;
		this.serviceId = session.appointment.serviceId;
		this.serviceName = session.appointment.serviceName;
		this.patientName = session.patient.fullName;
		this.providerName = session.provider.fullName;
		this.patientDocumentType =
			session.patient.documentType ?? this.patientDocumentType;
		this.patientDocumentNumber =
			session.patient.documentNumber ?? this.patientDocumentNumber;
		this.patientAge = session.patient.age ?? this.patientAge;
		this.bloodTypeLabel = session.patient.bloodType ?? 'No disponible';
		this.allergiesLabel = session.patient.allergies ?? 'No reportadas';
		this.riskIntegralLabel = session.patient.riskIntegral ?? 'Pendiente';

		const startedAt = new Date(session.instance.startedAt);
		if (!Number.isNaN(startedAt.getTime())) {
			this.attentionStartedAt = startedAt;
		}
	}

	private buildFormFromSession(
		blocks: EngineFormRenderableBlock[],
		instanceBlocks: Array<{
			id: string;
			blockId: string;
			status: string;
			responses: EngineFormInstanceBlockResponse[];
		}>,
	): void {
		const controls: Record<string, FormControl> = {};
		const responseByBlock = new Map(
			instanceBlocks.map((block) => [block.blockId, block.responses]),
		);

		for (const block of blocks) {
			const blockResponses = responseByBlock.get(block.id) ?? [];
			for (const field of block.fields) {
				const fieldResponses = blockResponses.filter(
					(response) => response.fieldId === field.id,
				);

				const control = new FormControl(
					this.getInitialValue(field, fieldResponses),
					this.getValidators(
						field.fieldType,
						field.isRequired && !field.isReadonly,
					),
				);

				if (field.isReadonly) {
					control.disable({ emitEvent: false });
				}

				controls[this.getControlName(field.id)] = control;
			}
		}

		this.attentionForm = new FormGroup(controls);

		// Detectar el fieldId del diagnóstico principal para habilitar órdenes médicas
		for (const block of blocks) {
			const diagField = block.fields.find((f) => f.code === 'PRIMARY_DIAGNOSIS');
			if (diagField) {
				this.primaryDiagnosisFieldId = diagField.id;
				break;
			}
		}
	}

	isLabResultsHistoryVisualBlock(block: EngineFormRenderableBlock): boolean {
		return block.code === 'LAB_RESULTS_HISTORY';
	}

	trackByPatientLabRow(_: number, row: PatientLabResultRow): string {
		return row.appointmentId;
	}

	getPatientLabResultStatusLabel(
		status: PatientLabResultRow['resultStatus'],
	): string {
		switch (status) {
			case 'PUBLISHED':
				return 'Publicado';
			case 'PENDING_VALIDATION':
				return 'Pendiente validación';
			default:
				return 'Borrador';
		}
	}

	getPatientLabResultStatusClass(
		status: PatientLabResultRow['resultStatus'],
	): string {
		switch (status) {
			case 'PUBLISHED':
				return 'px-2 py-0.5 rounded-md text-xs border bg-emerald-50 text-emerald-700 border-emerald-100';
			case 'PENDING_VALIDATION':
				return 'px-2 py-0.5 rounded-md text-xs border bg-amber-50 text-amber-700 border-amber-100';
			default:
				return 'px-2 py-0.5 rounded-md text-xs border bg-slate-100 text-slate-700 border-slate-200';
		}
	}

	private hasLabResultsHistoryVisualBlock(): boolean {
		return this.dynamicBlocks.some(
			(block) => block.code === 'LAB_RESULTS_HISTORY',
		);
	}

	private async loadPatientLabHistory(): Promise<void> {
		if (!this.patientId) {
			this.patientLabHistory = [];
			return;
		}

		this.loadingPatientLabHistory = true;
		try {
			const response = await firstValueFrom(
				this.labsDashboardService.getPatientLabHistoryForProvider(
					this.patientId,
				),
			);
			this.patientLabHistory = response.rows;
		} catch {
			this.patientLabHistory = [];
		} finally {
			this.loadingPatientLabHistory = false;
		}
	}

	private setupBmiAutoCalculation(): void {
		for (const subscription of this.bmiSubscriptions) {
			subscription.unsubscribe();
		}
		this.bmiSubscriptions = [];

		const weightFieldId = this.findFieldIdByCode('WEIGHT_KG');
		const heightFieldId = this.findFieldIdByCode('HEIGHT_CM');
		const bmiFieldId = this.findFieldIdByCode('BMI');

		if (!weightFieldId || !heightFieldId || !bmiFieldId) {
			return;
		}

		const weightControl = this.getFieldControl(weightFieldId);
		const heightControl = this.getFieldControl(heightFieldId);
		const bmiControl = this.getFieldControl(bmiFieldId);

		const recalculate = () => {
			const weight = this.parseNumeric(weightControl.value);
			const heightCm = this.parseNumeric(heightControl.value);

			if (weight === null || heightCm === null || heightCm <= 0) {
				bmiControl.setValue(null, { emitEvent: false });
				return;
			}

			const heightM = heightCm / 100;
			const bmi = weight / (heightM * heightM);
			const rounded = Math.round(bmi * 100) / 100;

			bmiControl.setValue(rounded, { emitEvent: false });
		};

		recalculate();

		this.bmiSubscriptions.push(
			weightControl.valueChanges.subscribe(recalculate),
		);
		this.bmiSubscriptions.push(
			heightControl.valueChanges.subscribe(recalculate),
		);
	}

	private findFieldIdByCode(code: string): string | null {
		for (const block of this.dynamicBlocks) {
			for (const field of block.fields) {
				if (field.code === code) {
					return field.id;
				}
			}
		}

		return null;
	}

	private parseNumeric(value: unknown): number | null {
		if (typeof value === 'number' && Number.isFinite(value)) {
			return value;
		}

		if (typeof value === 'string' && value.trim() !== '') {
			const parsed = Number(value.trim());
			return Number.isFinite(parsed) ? parsed : null;
		}

		return null;
	}

	private getInitialValue(
		field: EngineFormRenderableBlock['fields'][number],
		responses: EngineFormInstanceBlockResponse[],
	): unknown {
		if (responses.length === 0) {
			return this.getPrefillValue(field);
		}

		const fieldType = field.fieldType;

		switch (fieldType) {
			case 'NUMBER': {
				const numeric = responses.find(
					(response) => response.responseNumeric !== null,
				)?.responseNumeric;
				return numeric ?? null;
			}
			case 'CHECKBOX': {
				const bool = responses.find(
					(response) => response.responseBoolean !== null,
				)?.responseBoolean;
				return bool ?? false;
			}
			case 'MULTISELECT':
				return responses
					.map((response) => response.responseOptionId)
					.filter(
						(optionId): optionId is string => typeof optionId === 'string',
					);
			case 'SELECT':
			case 'RADIO':
				return (
					responses.find((response) => Boolean(response.responseOptionId))
						?.responseOptionId ?? ''
				);
			case 'DATE':
				return (
					responses.find((response) => Boolean(response.responseDate))
						?.responseDate ?? ''
				);
			case 'DATETIME': {
				const value = responses.find((response) =>
					Boolean(response.responseDatetime),
				)?.responseDatetime;

				return value ? this.toDatetimeLocal(value) : '';
			}
			default:
				return (
					responses.find((response) => Boolean(response.responseText))
						?.responseText ?? ''
				);
		}
	}

	private getPrefillValue(
		field: EngineFormRenderableBlock['fields'][number],
	): unknown {
		const prefill = field.prefillResponse;
		if (!prefill) {
			switch (field.fieldType) {
				case 'MULTISELECT':
					return [];
				case 'NUMBER':
					return null;
				case 'CHECKBOX':
					return false;
				default:
					return '';
			}
		}

		switch (field.fieldType) {
			case 'NUMBER':
				return prefill.responseNumeric;
			case 'CHECKBOX':
				return prefill.responseBoolean ?? false;
			case 'SELECT':
			case 'RADIO':
				return prefill.responseOptionId ?? '';
			case 'MULTISELECT':
				return prefill.responseOptionId ? [prefill.responseOptionId] : [];
			case 'DATE':
				return prefill.responseDate ?? '';
			case 'DATETIME':
				return prefill.responseDatetime
					? this.toDatetimeLocal(prefill.responseDatetime)
					: '';
			default:
				return prefill.responseText ?? '';
		}
	}

	private toDatetimeLocal(value: string): string {
		const parsedDate = new Date(value);
		if (Number.isNaN(parsedDate.getTime())) {
			return '';
		}

		const pad = (segment: number) => segment.toString().padStart(2, '0');
		return `${parsedDate.getFullYear()}-${pad(parsedDate.getMonth() + 1)}-${pad(parsedDate.getDate())}T${pad(parsedDate.getHours())}:${pad(parsedDate.getMinutes())}`;
	}

	private async persistCurrentResponses(
		markAsCompleted: boolean,
	): Promise<void> {
		if (!this.instanceId || this.dynamicBlocks.length === 0) {
			this.showFeedback(
				'No hay una instancia activa de formulario para guardar.',
			);
			return;
		}

		let savedBlocks = 0;
		let savedResponses = 0;

		for (const block of this.dynamicBlocks) {
			const instanceBlockId = this.instanceBlockIdsByBlockId[block.id];
			if (!instanceBlockId) {
				continue;
			}

			const responses = this.buildBlockResponses(block);
			if (responses.length === 0) {
				continue;
			}

			await firstValueFrom(
				this.engineFormService.saveBlockResponses(
					this.instanceId,
					instanceBlockId,
					{
						responses,
					},
				),
			);

			savedBlocks += 1;
			savedResponses += responses.length;
		}

		if (savedBlocks === 0) {
			this.showFeedback('No hay cambios con valor para guardar todavía.');
			return;
		}

		if (markAsCompleted) {
			this.showFeedback(
				`Consulta guardada con ${savedResponses} respuestas en ${savedBlocks} bloques.`,
			);
			return;
		}

		const answered = this.countAnsweredFields();
		this.showFeedback(
			`Borrador guardado en backend (${answered}/${this.totalFields} campos diligenciados).`,
		);
	}

	private buildBlockResponses(
		block: EngineFormRenderableBlock,
	): SaveEngineFormResponseRequestItem[] {
		const responses: SaveEngineFormResponseRequestItem[] = [];

		for (const field of block.fields) {
			if (field.isReadonly) {
				continue;
			}

			const control = this.getFieldControl(field.id);
			const value = control.value;

			switch (field.fieldType) {
				case 'CHECKBOX':
					if (value === true) {
						responses.push({
							fieldId: field.id,
							responseBoolean: true,
						});
					}
					break;
				case 'NUMBER': {
					const numeric =
						typeof value === 'number' ? value : Number(String(value).trim());
					if (!Number.isNaN(numeric) && String(value).trim() !== '') {
						responses.push({
							fieldId: field.id,
							responseNumeric: numeric,
						});
					}
					break;
				}
				case 'SELECT':
				case 'RADIO':
					if (typeof value === 'string' && value.trim() !== '') {
						responses.push({
							fieldId: field.id,
							responseOptionId: value,
						});
					}
					break;
				case 'MULTISELECT':
					if (Array.isArray(value)) {
						for (const optionId of value) {
							if (typeof optionId === 'string' && optionId.trim() !== '') {
								responses.push({
									fieldId: field.id,
									responseOptionId: optionId,
								});
							}
						}
					}
					break;
				case 'DATE':
					if (typeof value === 'string' && value.trim() !== '') {
						responses.push({
							fieldId: field.id,
							responseDate: value,
						});
					}
					break;
				case 'DATETIME':
					if (typeof value === 'string' && value.trim() !== '') {
						const parsedDate = new Date(value);
						if (!Number.isNaN(parsedDate.getTime())) {
							responses.push({
								fieldId: field.id,
								responseDatetime: parsedDate.toISOString(),
							});
						}
					}
					break;
				default:
					if (value !== null && value !== undefined) {
						const textValue = String(value).trim();
						if (textValue !== '') {
							responses.push({
								fieldId: field.id,
								responseText: textValue,
							});
						}
					}
					break;
			}
		}

		return responses;
	}

	private getValidators(fieldType: EngineFormFieldType, isRequired: boolean) {
		if (!isRequired) {
			return [];
		}

		if (fieldType === 'CHECKBOX') {
			return [Validators.requiredTrue];
		}

		return [Validators.required];
	}

	private getControlName(fieldId: string): string {
		return `field_${fieldId.replace(/[^a-zA-Z0-9]/g, '_')}`;
	}

	private countAnsweredFields(): number {
		const values = this.attentionForm.value;
		let answered = 0;

		for (const value of Object.values(values)) {
			if (Array.isArray(value)) {
				if (value.length > 0) {
					answered += 1;
				}
				continue;
			}

			if (typeof value === 'boolean') {
				if (value) {
					answered += 1;
				}
				continue;
			}

			if (value !== null && value !== undefined && `${value}`.trim() !== '') {
				answered += 1;
			}
		}

		return answered;
	}

	private startElapsedTimer(): void {
		if (this.timerHandle) {
			clearInterval(this.timerHandle);
			this.timerHandle = null;
		}

		this.updateElapsedLabel();
		this.timerHandle = setInterval(() => {
			this.updateElapsedLabel();
		}, 1000);
	}

	private updateElapsedLabel(): void {
		const elapsedMs = Math.max(
			0,
			Date.now() - this.attentionStartedAt.getTime(),
		);
		const totalSeconds = Math.floor(elapsedMs / 1000);

		const hours = Math.floor(totalSeconds / 3600)
			.toString()
			.padStart(2, '0');
		const minutes = Math.floor((totalSeconds % 3600) / 60)
			.toString()
			.padStart(2, '0');
		const seconds = (totalSeconds % 60).toString().padStart(2, '0');

		this.elapsedLabel = `${hours}:${minutes}:${seconds}`;
	}

	private showFeedback(message: string): void {
		this.actionFeedback = message;

		if (this.feedbackTimerHandle) {
			clearTimeout(this.feedbackTimerHandle);
		}

		this.feedbackTimerHandle = setTimeout(() => {
			this.actionFeedback = '';
		}, 2600);
	}
}
