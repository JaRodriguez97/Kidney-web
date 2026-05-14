import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
	FormBuilder,
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
	EngineFormFieldType,
	EngineFormRenderableBlock,
	EngineFormService,
	SaveEngineFormResponseRequestItem,
} from '@app/core/services/engine-form.service';
import { firstValueFrom } from 'rxjs';
import { DynamicEngineFieldComponent } from '../clinical-attention-provider/components/dynamic-engine-field/dynamic-engine-field.component';

export type MedicalOrderType = 'formula' | 'labs' | 'referral' | 'incapacity';

const ORDER_TEMPLATE_MAP: Record<MedicalOrderType, string> = {
	formula: 'MEDICATION_FORMULA',
	labs: 'LABORATORY_REQUEST',
	referral: 'REFERRAL_REQUEST',
	incapacity: 'INCAPACITY_CERTIFICATE',
};

const ORDER_TITLE_MAP: Record<MedicalOrderType, string> = {
	formula: 'Fórmula de Medicamentos',
	labs: 'Solicitud de Laboratorios',
	referral: 'Remisión e Interconsulta',
	incapacity: 'Certificado de Incapacidad',
};

/** Campo del template de orden que se pre-rellena con el diagnóstico principal. */
const ORDER_DIAGNOSIS_PREFILL_FIELD: Partial<Record<MedicalOrderType, string>> = {
	labs: 'LAB_ORDER_CLINICAL_JUSTIFICATION',
	referral: 'REFERRAL_REASON',
	incapacity: 'INCAPACITY_DIAGNOSIS',
	// formula: sin pre-relleno de campo — el diagnóstico se muestra solo como contexto visual
};

@Component({
	selector: 'app-medical-order-provider',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, DynamicEngineFieldComponent],
	templateUrl: './medical-order-provider.component.html',
	styleUrl: './medical-order-provider.component.scss',
})
export class MedicalOrderProviderComponent implements OnInit {
	private readonly router = inject(Router);
	private readonly route = inject(ActivatedRoute);
	private readonly fb = inject(FormBuilder);
	private readonly engineFormService = inject(EngineFormService);

	// Contexto de navegación
	orderType: MedicalOrderType = 'formula';
	orderTitle = '';
	appointmentId = '';
	patientId = '';
	serviceId = '';
	serviceName = '';
	patientName = '';
	primaryDiagnosis = '';

	// Estado de renderizado
	loading = false;
	saving = false;
	saved = false;
	loadError = '';
	saveError = '';

	// Datos del formulario dinámico
	dynamicBlocks: EngineFormRenderableBlock[] = [];
	orderForm: FormGroup = this.fb.group({});
	private orderInstanceId = '';
	private instanceBlockIdsByBlockId: Record<string, string> = {};

	ngOnInit(): void {
		this.hydrateContext();
		void this.loadOrderForm();
	}

	goBack(): void {
		void this.router.navigate(['/dashboard/provider/clinical-attention'], {
			queryParams: {
				appointmentId: this.appointmentId,
				patientId: this.patientId,
				serviceId: this.serviceId,
				serviceName: this.serviceName,
			},
		});
	}

	async saveOrder(): Promise<void> {
		if (this.orderForm.invalid) {
			this.orderForm.markAllAsTouched();
			return;
		}

		this.saving = true;
		this.saveError = '';

		try {
			for (const block of this.dynamicBlocks) {
				const instanceBlockId = this.instanceBlockIdsByBlockId[block.id];
				if (!instanceBlockId) continue;

				const responses: SaveEngineFormResponseRequestItem[] = [];

				for (const field of block.fields) {
					const controlName = this.getControlName(field.id);
					const control = this.orderForm.get(controlName);
					if (!control) continue;

					const raw = control.value as unknown;
					const item: SaveEngineFormResponseRequestItem = { fieldId: field.id };

					switch (field.fieldType) {
						case 'NUMBER':
							if (raw !== null && raw !== '') {
								item.responseNumeric = Number(raw);
							}
							break;
						case 'CHECKBOX':
							item.responseBoolean = Boolean(raw);
							break;
						case 'DATE':
							if (typeof raw === 'string' && raw) {
								item.responseDate = raw;
							}
							break;
						case 'DATETIME':
							if (typeof raw === 'string' && raw) {
								item.responseDatetime = raw;
							}
							break;
						case 'SELECT':
						case 'RADIO':
							if (typeof raw === 'string' && raw) {
								item.responseOptionId = raw;
							}
							break;
						case 'MULTISELECT':
							if (Array.isArray(raw) && (raw as string[]).length > 0) {
								item.responseOptionId = (raw as string[])[0];
							}
							break;
						default:
							if (typeof raw === 'string' && raw) {
								item.responseText = raw;
							}
					}

					responses.push(item);
				}

				if (responses.length > 0) {
					await firstValueFrom(
						this.engineFormService.saveBlockResponses(
							this.orderInstanceId,
							instanceBlockId,
							{ responses },
						),
					);
				}
			}

			this.saved = true;
		} catch {
			this.saveError = 'No fue posible guardar la orden. Intenta nuevamente.';
		} finally {
			this.saving = false;
		}
	}

	isWideField(fieldType: EngineFormFieldType): boolean {
		return fieldType === 'TEXTAREA';
	}

	getFieldControl(fieldId: string): FormControl {
		const controlName = this.getControlName(fieldId);
		const existing = this.orderForm.get(controlName);
		if (existing) return existing as FormControl;
		const fallback = this.fb.control('');
		this.orderForm.addControl(controlName, fallback);
		return fallback;
	}

	// ─── Privados ───────────────────────────────────────────────────────────────

	private hydrateContext(): void {
		const rawType = this.route.snapshot.params['orderType'] as string;
		this.orderType = (
			['formula', 'labs', 'referral', 'incapacity'].includes(rawType)
				? rawType
				: 'formula'
		) as MedicalOrderType;
		this.orderTitle = ORDER_TITLE_MAP[this.orderType];

		const q = this.route.snapshot.queryParamMap;
		this.appointmentId = q.get('appointmentId') ?? '';
		this.patientId = q.get('patientId') ?? '';
		this.serviceId = q.get('serviceId') ?? '';
		this.serviceName = q.get('serviceName') ?? '';
		this.patientName = q.get('patientName') ?? '';
		this.primaryDiagnosis = q.get('primaryDiagnosis') ?? '';
	}

	private async loadOrderForm(): Promise<void> {
		this.loading = true;
		this.loadError = '';

		try {
			// 1. Buscar el templateId por código
			const templates = await firstValueFrom(
				this.engineFormService.listActiveTemplates(),
			);
			const templateCode = ORDER_TEMPLATE_MAP[this.orderType];
			const template = templates.find((t) => t.code === templateCode);

			if (!template) {
				this.loadError = `No se encontró el template "${templateCode}" activo en el sistema.`;
				return;
			}

			// 2. Obtener el template renderizable con sus bloques y campos
			const renderable = await firstValueFrom(
				this.engineFormService.getRenderableTemplate(template.id),
			);
			this.dynamicBlocks = renderable.activeVersion?.blocks ?? [];

			if (this.dynamicBlocks.length === 0) {
				this.loadError = 'El template de la orden no tiene bloques configurados.';
				return;
			}

			// 3. Crear instancia del formulario de orden
			const instance = await firstValueFrom(
				this.engineFormService.createInstance({
					templateId: template.id,
					patientId: this.patientId || undefined,
					appointmentId: this.appointmentId || undefined,
				}),
			);
			this.orderInstanceId = instance.id;

			// Mapear blockId → instanceBlockId usando block_id del response de createInstance
			this.instanceBlockIdsByBlockId = Object.fromEntries(
				instance.blocks.map((b) => [b.block_id, b.id]),
			);

			// 4. Construir el formulario reactivo
			this.buildOrderForm(this.dynamicBlocks);

			// 5. Pre-rellenar con diagnóstico principal si aplica
			this.prefillDiagnosisField();
		} catch {
			this.loadError =
				'No fue posible cargar el formulario de la orden. Intenta nuevamente.';
		} finally {
			this.loading = false;
		}
	}

	private buildOrderForm(blocks: EngineFormRenderableBlock[]): void {
		const controls: Record<string, FormControl> = {};

		for (const block of blocks) {
			for (const field of block.fields) {
				const validators =
					field.isRequired && !field.isReadonly ? [Validators.required] : [];
				const control = new FormControl(
					this.getDefaultValue(field.fieldType),
					validators,
				);
				if (field.isReadonly) {
					control.disable({ emitEvent: false });
				}
				controls[this.getControlName(field.id)] = control;
			}
		}

		this.orderForm = new FormGroup(controls);
	}

	private prefillDiagnosisField(): void {
		if (!this.primaryDiagnosis) return;
		const prefillCode = ORDER_DIAGNOSIS_PREFILL_FIELD[this.orderType];
		if (!prefillCode) return;

		for (const block of this.dynamicBlocks) {
			const field = block.fields.find((f) => f.code === prefillCode);
			if (field) {
				const control = this.orderForm.get(this.getControlName(field.id));
				control?.setValue(this.primaryDiagnosis, { emitEvent: false });
				break;
			}
		}
	}

	private getControlName(fieldId: string): string {
		return `order_field_${fieldId.replace(/[^a-zA-Z0-9]/g, '_')}`;
	}

	private getDefaultValue(
		fieldType: EngineFormFieldType,
	): string | number | boolean | null {
		switch (fieldType) {
			case 'NUMBER':
				return null;
			case 'CHECKBOX':
				return false;
			default:
				return '';
		}
	}
}
