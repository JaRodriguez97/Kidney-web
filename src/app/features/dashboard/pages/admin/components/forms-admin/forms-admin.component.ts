import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
	ActiveStatus,
	CreateFieldOptionPayload,
	CreateBlockPayload,
	CreateFieldPayload,
	CreateTemplatePayload,
	EngineFormAdminBlock,
	EngineFormAdminBlockCatalogItem,
	EngineFormAdminField,
	EngineFormAdminFieldCatalogItem,
	EngineFormFieldType,
	EngineFormAdminService,
	EngineFormAdminTemplateDetail,
	EngineFormAdminTemplateListItem,
	UpdateBlockPayload,
	UpdateFieldPayload,
	UpdateTemplatePayload,
} from '@app/core/services/engine-form-admin.service';
import {
	TemplateFormModalComponent,
	TemplateFormModalSubmit,
} from './components/template-form-modal/template-form-modal.component';
import {
	BlockFormModalComponent,
	BlockFormModalSubmit,
} from './components/block-form-modal/block-form-modal.component';
import {
	FieldFormModalComponent,
	FieldFormModalSubmit,
} from './components/field-form-modal/field-form-modal.component';
import {
	CreateVersionModalComponent,
	CreateVersionModalSubmit,
} from './components/create-version-modal/create-version-modal.component';

@Component({
	selector: 'app-forms-admin',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		TemplateFormModalComponent,
		BlockFormModalComponent,
		FieldFormModalComponent,
		CreateVersionModalComponent,
	],
	templateUrl: './forms-admin.component.html',
	styleUrl: './forms-admin.component.scss',
})
export class FormsAdminComponent implements OnInit {
	private readonly engineFormAdminService = inject(EngineFormAdminService);

	loadingTemplates = false;
	loadingDetail = false;
	loadingVersionBlocks = false;
	loadingBlockCatalog = false;
	loadingFieldCatalog = false;
	saving = false;
	errorMessage = '';
	successMessage = '';
	searchTerm = '';
	activeTab: 'templates' | 'blocks' | 'fields' = 'templates';

	templates: EngineFormAdminTemplateListItem[] = [];
	allBlocks: EngineFormAdminBlockCatalogItem[] = [];
	allFields: EngineFormAdminFieldCatalogItem[] = [];
	selectedTemplateId: string | null = null;
	selectedVersionId: string | null = null;
	selectedTemplateDetail: EngineFormAdminTemplateDetail | null = null;
	versionBlocks: EngineFormAdminBlock[] = [];

	templateModalVisible = false;
	templateModalMode: 'create' | 'edit' = 'create';
	templateDraft = {
		code: '',
		name: '',
		description: '',
	};

	blockModalVisible = false;
	blockModalMode: 'create' | 'edit' = 'create';
	blockEditingId: string | null = null;
	blockDraft = {
		code: '',
		name: '',
		description: '',
		sortOrder: 1,
		selectedFieldIds: [] as string[],
	};

	fieldModalVisible = false;
	fieldModalMode: 'create' | 'edit' = 'create';
	fieldEditingId: string | null = null;
	fieldTargetBlockId: string | null = null;
	fieldDraft: {
		code: string;
		label: string;
		fieldType: EngineFormFieldType;
		placeholder: string;
		isRequired: boolean;
		sortOrder: number;
		optionsText: string;
	} = {
		code: '',
		label: '',
		fieldType: 'TEXT',
		placeholder: '',
		isRequired: false,
		sortOrder: 1,
		optionsText: '',
	};

	versionModalVisible = false;
	versionModalPreSelectedBlockIds: string[] = [];

	ngOnInit(): void {
		this.loadTemplates();
		this.loadBlockCatalog();
		this.loadFieldCatalog();
	}

	get filteredTemplates(): EngineFormAdminTemplateListItem[] {
		const term = this.searchTerm.trim().toLowerCase();
		if (!term) {
			return this.templates;
		}

		return this.templates.filter(
			(template) =>
				template.name.toLowerCase().includes(term) ||
				template.code.toLowerCase().includes(term),
		);
	}

	get filteredBlockCatalog(): EngineFormAdminBlockCatalogItem[] {
		const term = this.searchTerm.trim().toLowerCase();
		if (!term) {
			return this.allBlocks;
		}

		return this.allBlocks.filter(
			(block) =>
				block.name.toLowerCase().includes(term) ||
				(block.code ?? '').toLowerCase().includes(term) ||
				block.templateName.toLowerCase().includes(term),
		);
	}

	get filteredFieldCatalog(): EngineFormAdminFieldCatalogItem[] {
		const term = this.searchTerm.trim().toLowerCase();
		if (!term) {
			return this.allFields;
		}

		return this.allFields.filter(
			(field) =>
				field.label.toLowerCase().includes(term) ||
				(field.code ?? '').toLowerCase().includes(term) ||
				field.blockName.toLowerCase().includes(term) ||
				field.templateName.toLowerCase().includes(term),
		);
	}

	get displayedBlocks(): EngineFormAdminBlock[] {
		if (this.selectedVersionId) {
			return this.versionBlocks;
		}

		return this.selectedTemplateDetail?.blocks ?? [];
	}

	trackByTemplate(
		_: number,
		template: EngineFormAdminTemplateListItem,
	): string {
		return template.id;
	}

	trackByBlock(_: number, block: EngineFormAdminBlock): string {
		return block.id;
	}

	trackByBlockCatalog(
		_: number,
		block: EngineFormAdminBlockCatalogItem,
	): string {
		return block.id;
	}

	trackByField(_: number, field: EngineFormAdminField): string {
		return field.id;
	}

	trackByFieldCatalog(
		_: number,
		field: EngineFormAdminFieldCatalogItem,
	): string {
		return field.id;
	}

	setActiveTab(tab: 'templates' | 'blocks' | 'fields'): void {
		this.activeTab = tab;

		if (tab === 'blocks' && this.allBlocks.length === 0) {
			this.loadBlockCatalog();
		}

		if (tab === 'fields' && this.allFields.length === 0) {
			this.loadFieldCatalog();
		}
	}

	selectTemplate(templateId: string): void {
		if (this.selectedTemplateId === templateId && this.selectedTemplateDetail) {
			return;
		}

		this.loadTemplateDetail(templateId);
	}

	openCreateTemplate(): void {
		this.templateModalMode = 'create';
		this.templateDraft = {
			code: '',
			name: '',
			description: '',
		};
		this.templateModalVisible = true;
	}

	openEditTemplate(): void {
		if (!this.selectedTemplateDetail) {
			return;
		}

		this.templateModalMode = 'edit';
		this.templateDraft = {
			code: this.selectedTemplateDetail.code,
			name: this.selectedTemplateDetail.name,
			description: this.selectedTemplateDetail.description ?? '',
		};
		this.templateModalVisible = true;
	}

	toggleTemplateStatus(): void {
		if (!this.selectedTemplateDetail) {
			return;
		}

		const nextStatus = this.nextStatus(this.selectedTemplateDetail.status);
		this.saving = true;
		this.errorMessage = '';
		this.successMessage = '';

		this.engineFormAdminService
			.updateTemplate(this.selectedTemplateDetail.id, { status: nextStatus })
			.subscribe({
				next: () => {
					this.saving = false;
					this.successMessage =
						nextStatus === 'ACTIVE'
							? 'Formulario habilitado correctamente.'
							: 'Formulario deshabilitado correctamente.';
					if (this.selectedTemplateId) {
						this.loadTemplateDetail(this.selectedTemplateId);
						this.loadTemplates(this.selectedTemplateId);
					}
				},
				error: (error: unknown) => {
					this.saving = false;
					this.errorMessage = this.extractErrorMessage(error);
				},
			});
	}

	onTemplateModalClose(): void {
		this.templateModalVisible = false;
	}

	submitTemplateModal(): void {
		const payload: TemplateFormModalSubmit = {
			code: this.templateDraft.code.trim(),
			name: this.templateDraft.name.trim(),
			description: this.templateDraft.description.trim()
				? this.templateDraft.description.trim()
				: null,
		};

		if (!payload.name) {
			this.errorMessage = 'El nombre del formulario es obligatorio.';
			return;
		}

		if (this.templateModalMode === 'create' && !payload.code) {
			this.errorMessage = 'El código del formulario es obligatorio.';
			return;
		}

		this.onTemplateModalSave(payload);
	}

	onTemplateModalSave(payload: TemplateFormModalSubmit): void {
		this.saving = true;
		this.errorMessage = '';
		this.successMessage = '';

		if (this.templateModalMode === 'create') {
			const createPayload: CreateTemplatePayload = {
				code: payload.code,
				name: payload.name,
				description: payload.description ?? undefined,
			};

			this.engineFormAdminService.createTemplate(createPayload).subscribe({
				next: (created) => {
					this.templateModalVisible = false;
					this.successMessage = 'Formulario creado correctamente.';
					this.saving = false;
					this.loadTemplates(created.id);
				},
				error: (error: unknown) => {
					this.saving = false;
					this.errorMessage = this.extractErrorMessage(error);
				},
			});
			return;
		}

		if (!this.selectedTemplateId) {
			this.saving = false;
			return;
		}

		const updatePayload: UpdateTemplatePayload = {
			name: payload.name,
			description: payload.description ?? null,
		};

		this.engineFormAdminService
			.updateTemplate(this.selectedTemplateId, updatePayload)
			.subscribe({
				next: () => {
					this.templateModalVisible = false;
					this.successMessage = 'Formulario actualizado correctamente.';
					this.saving = false;
					this.loadTemplates(this.selectedTemplateId ?? undefined);
					if (this.selectedTemplateId) {
						this.loadTemplateDetail(this.selectedTemplateId);
					}
				},
				error: (error: unknown) => {
					this.saving = false;
					this.errorMessage = this.extractErrorMessage(error);
				},
			});
	}

	openCreateBlock(): void {
		if (!this.selectedTemplateDetail) {
			return;
		}

		if (this.allFields.length === 0 && !this.loadingFieldCatalog) {
			this.loadFieldCatalog();
		}

		const maxSortOrder = this.selectedTemplateDetail.blocks.reduce(
			(max, block) => Math.max(max, block.sortOrder),
			0,
		);

		this.blockModalMode = 'create';
		this.blockEditingId = null;
		this.blockDraft = {
			code: '',
			name: '',
			description: '',
			sortOrder: maxSortOrder + 1,
			selectedFieldIds: [],
		};
		this.blockModalVisible = true;
	}

	openEditBlock(block: EngineFormAdminBlock): void {
		this.blockModalMode = 'edit';
		this.blockEditingId = block.id;
		this.blockDraft = {
			code: block.code ?? '',
			name: block.name,
			description: block.description ?? '',
			sortOrder: block.sortOrder,
			selectedFieldIds: [],
		};
		this.blockModalVisible = true;
	}

	toggleBlockStatus(block: EngineFormAdminBlock): void {
		const nextStatus = this.nextStatus(block.status);

		this.errorMessage = '';
		this.successMessage = '';
		this.saving = true;

		this.engineFormAdminService
			.updateBlock(block.id, { status: nextStatus })
			.subscribe({
				next: () => {
					this.saving = false;
					this.loadBlockCatalog();
					this.successMessage =
						nextStatus === 'ACTIVE'
							? 'Bloque habilitado correctamente.'
							: 'Bloque deshabilitado correctamente.';
					if (this.selectedTemplateId) {
						this.loadTemplateDetail(this.selectedTemplateId);
					}
				},
				error: (error: unknown) => {
					this.saving = false;
					this.errorMessage = this.extractErrorMessage(error);
				},
			});
	}

	onBlockModalClose(): void {
		this.blockModalVisible = false;
	}

	submitBlockModal(): void {
		const payload: BlockFormModalSubmit = {
			code: this.blockDraft.code.trim() ? this.blockDraft.code.trim() : null,
			name: this.blockDraft.name.trim(),
			description: this.blockDraft.description.trim()
				? this.blockDraft.description.trim()
				: null,
			sortOrder: Number(this.blockDraft.sortOrder),
		};

		if (!payload.name) {
			this.errorMessage = 'El nombre del bloque es obligatorio.';
			return;
		}

		if (!Number.isFinite(payload.sortOrder) || payload.sortOrder < 1) {
			this.errorMessage = 'El orden del bloque debe ser mayor o igual a 1.';
			return;
		}

		this.onBlockModalSave(payload);
	}

	onBlockModalSave(payload: BlockFormModalSubmit): void {
		this.errorMessage = '';
		this.successMessage = '';
		this.saving = true;

		if (this.blockModalMode === 'create') {
			if (!this.selectedTemplateId) {
				this.saving = false;
				return;
			}

			const createPayload: CreateBlockPayload = {
				code: payload.code ?? undefined,
				name: payload.name,
				description: payload.description ?? undefined,
				sortOrder: payload.sortOrder,
			};

			this.engineFormAdminService
				.createBlock(this.selectedTemplateId, createPayload)
				.subscribe({
					next: (createdBlock) => {
						const completeBlockCreation = (successMessage: string) => {
							this.blockModalVisible = false;
							this.successMessage = successMessage;
							this.saving = false;
							this.loadBlockCatalog();
							this.loadFieldCatalog();
							if (this.selectedTemplateId) {
								this.loadTemplateDetail(this.selectedTemplateId);
							}
						};

						const selectedFieldIds = payload.selectedFieldIds ?? [];
						if (selectedFieldIds.length === 0) {
							completeBlockCreation('Bloque creado correctamente.');
							return;
						}

						const fieldsToClone = this.allFields.filter((field) =>
							selectedFieldIds.includes(field.id),
						);

						const cloneRequests = fieldsToClone.map((field, index) =>
							this.engineFormAdminService.cloneFieldToBlock(field.id, {
								blockId: createdBlock.id,
								sortOrder: field.sortOrder ?? index + 1,
							}),
						);

						if (cloneRequests.length === 0) {
							completeBlockCreation('Bloque creado correctamente.');
							return;
						}

						forkJoin(cloneRequests).subscribe({
							next: () => {
								completeBlockCreation(
									'Bloque creado correctamente con campos importados.',
								);
							},
							error: (cloneError: unknown) => {
								this.saving = false;
								this.errorMessage =
									'Bloque creado, pero falló la importación de algunos campos: ' +
									this.extractErrorMessage(cloneError);
								this.loadBlockCatalog();
								this.loadFieldCatalog();
								if (this.selectedTemplateId) {
									this.loadTemplateDetail(this.selectedTemplateId);
								}
							},
						});
					},
					error: (error: unknown) => {
						this.saving = false;
						this.errorMessage = this.extractErrorMessage(error);
					},
				});
			return;
		}

		if (!this.blockEditingId) {
			this.saving = false;
			return;
		}

		const updatePayload: UpdateBlockPayload = {
			name: payload.name,
			description: payload.description ?? null,
			sortOrder: payload.sortOrder,
		};

		this.engineFormAdminService
			.updateBlock(this.blockEditingId, updatePayload)
			.subscribe({
				next: () => {
					this.blockModalVisible = false;
					this.successMessage = 'Bloque actualizado correctamente.';
					this.saving = false;
					this.loadBlockCatalog();
					if (this.selectedTemplateId) {
						this.loadTemplateDetail(this.selectedTemplateId);
					}
				},
				error: (error: unknown) => {
					this.saving = false;
					this.errorMessage = this.extractErrorMessage(error);
				},
			});
	}

	openCreateField(blockId: string): void {
		const block = this.selectedTemplateDetail?.blocks.find(
			(candidate) => candidate.id === blockId,
		);
		const maxSortOrder = (block?.fields ?? []).reduce(
			(max, field) => Math.max(max, field.sortOrder ?? 0),
			0,
		);

		this.fieldModalMode = 'create';
		this.fieldEditingId = null;
		this.fieldTargetBlockId = blockId;
		this.fieldDraft = {
			code: '',
			label: '',
			fieldType: 'TEXT',
			placeholder: '',
			isRequired: false,
			sortOrder: maxSortOrder + 1,
			optionsText: '',
		};
		this.fieldModalVisible = true;
	}

	openEditField(blockId: string, field: EngineFormAdminField): void {
		this.fieldModalMode = 'edit';
		this.fieldEditingId = field.id;
		this.fieldTargetBlockId = blockId;
		this.fieldDraft = {
			code: field.code ?? '',
			label: field.label,
			fieldType: field.fieldType,
			placeholder: field.placeholder ?? '',
			isRequired: field.isRequired,
			sortOrder: field.sortOrder ?? 1,
			optionsText: field.options
				.map(
					(option) =>
						`${option.label}|${option.value ?? ''}|${option.code ?? ''}`,
				)
				.join('\n'),
		};
		this.fieldModalVisible = true;
	}

	toggleFieldStatus(field: EngineFormAdminField): void {
		const nextStatus = this.nextStatus(field.status);

		this.errorMessage = '';
		this.successMessage = '';
		this.saving = true;

		this.engineFormAdminService
			.updateField(field.id, { status: nextStatus })
			.subscribe({
				next: () => {
					this.saving = false;
					this.loadFieldCatalog();
					this.successMessage =
						nextStatus === 'ACTIVE'
							? 'Campo habilitado correctamente.'
							: 'Campo deshabilitado correctamente.';
					if (this.selectedTemplateId) {
						this.loadTemplateDetail(this.selectedTemplateId);
					}
				},
				error: (error: unknown) => {
					this.saving = false;
					this.errorMessage = this.extractErrorMessage(error);
				},
			});
	}

	onFieldModalClose(): void {
		this.fieldModalVisible = false;
	}

	submitFieldModal(): void {
		const fieldType = this.fieldDraft.fieldType;
		const options = this.parseFieldOptions(this.fieldDraft.optionsText);

		if (!this.fieldDraft.label.trim()) {
			this.errorMessage = 'La etiqueta del campo es obligatoria.';
			return;
		}

		if (
			this.fieldModalMode === 'create' &&
			this.requiresOptions(fieldType) &&
			options.length === 0
		) {
			this.errorMessage =
				'Los campos SELECT, MULTISELECT y RADIO requieren al menos una opción.';
			return;
		}

		const payload: FieldFormModalSubmit = {
			code: this.fieldDraft.code.trim() ? this.fieldDraft.code.trim() : null,
			label: this.fieldDraft.label.trim(),
			fieldType,
			placeholder: this.fieldDraft.placeholder.trim()
				? this.fieldDraft.placeholder.trim()
				: null,
			isRequired: this.fieldDraft.isRequired,
			sortOrder: Number(this.fieldDraft.sortOrder),
			options: options.length > 0 ? options : undefined,
		};

		if (!Number.isFinite(payload.sortOrder) || payload.sortOrder < 1) {
			this.errorMessage = 'El orden del campo debe ser mayor o igual a 1.';
			return;
		}

		this.onFieldModalSave(payload);
	}

	onFieldModalSave(payload: FieldFormModalSubmit): void {
		this.errorMessage = '';
		this.successMessage = '';
		this.saving = true;

		if (this.fieldModalMode === 'create') {
			if (!this.fieldTargetBlockId) {
				this.saving = false;
				return;
			}

			const createPayload: CreateFieldPayload = {
				code: payload.code ?? undefined,
				label: payload.label,
				fieldType: payload.fieldType,
				placeholder: payload.placeholder ?? undefined,
				isRequired: payload.isRequired,
				sortOrder: payload.sortOrder,
				options: payload.options,
			};

			this.engineFormAdminService
				.createField(this.fieldTargetBlockId, createPayload)
				.subscribe({
					next: () => {
						this.fieldModalVisible = false;
						this.successMessage = 'Campo creado correctamente.';
						this.saving = false;
						this.loadFieldCatalog();
						this.loadBlockCatalog();
						if (this.selectedTemplateId) {
							this.loadTemplateDetail(this.selectedTemplateId);
						}
					},
					error: (error: unknown) => {
						this.saving = false;
						this.errorMessage = this.extractErrorMessage(error);
					},
				});
			return;
		}

		if (!this.fieldEditingId) {
			this.saving = false;
			return;
		}

		const updatePayload: UpdateFieldPayload = {
			label: payload.label,
			placeholder: payload.placeholder ?? null,
			isRequired: payload.isRequired,
			sortOrder: payload.sortOrder,
		};

		this.engineFormAdminService
			.updateField(this.fieldEditingId, updatePayload)
			.subscribe({
				next: () => {
					this.fieldModalVisible = false;
					this.successMessage = 'Campo actualizado correctamente.';
					this.saving = false;
					this.loadFieldCatalog();
					if (this.selectedTemplateId) {
						this.loadTemplateDetail(this.selectedTemplateId);
					}
				},
				error: (error: unknown) => {
					this.saving = false;
					this.errorMessage = this.extractErrorMessage(error);
				},
			});
	}

	createVersionFromCurrentBlocks(): void {
		if (!this.selectedTemplateDetail) {
			return;
		}

		const openModal = () => {
			const activeBlocks = this.selectedTemplateDetail?.blocks
				.filter((block) => block.isInActiveVersion)
				.map((block) => block.id);

			const fallbackBlocks = this.selectedTemplateDetail?.blocks.map(
				(block) => block.id,
			);

			this.versionModalPreSelectedBlockIds =
				(activeBlocks && activeBlocks.length > 0 ? activeBlocks : fallbackBlocks) ??
				[];
			this.versionModalVisible = true;
		};

		if (this.allBlocks.length > 0) {
			openModal();
			return;
		}

		this.loadBlockCatalog(openModal);
	}

	onVersionModalClose(): void {
		this.versionModalVisible = false;
	}

	onVersionModalSave(payload: CreateVersionModalSubmit): void {
		if (!this.selectedTemplateDetail) {
			return;
		}

		this.errorMessage = '';
		this.successMessage = '';
		this.saving = true;

		this.engineFormAdminService
			.createVersion(this.selectedTemplateDetail.id, {
				releaseNotes:
					payload.releaseNotes ??
					`Versión creada desde panel admin (${new Date().toISOString()})`,
				blockIds: payload.blockIds,
			})
			.subscribe({
				next: () => {
					this.versionModalVisible = false;
					this.successMessage = 'Versión creada correctamente.';
					this.saving = false;
					if (this.selectedTemplateId) {
						this.loadTemplateDetail(this.selectedTemplateId);
						this.loadTemplates(this.selectedTemplateId);
					}
				},
				error: (error: unknown) => {
					this.saving = false;
					this.errorMessage = this.extractErrorMessage(error);
				},
			});
	}

	selectVersion(versionId: string): void {
		if (this.selectedVersionId === versionId && this.versionBlocks.length > 0) {
			return;
		}

		this.selectedVersionId = versionId;
		this.loadVersionBlocks(versionId);
	}

	publishVersion(versionId: string): void {
		this.errorMessage = '';
		this.successMessage = '';
		this.saving = true;

		this.engineFormAdminService.publishVersion(versionId).subscribe({
			next: () => {
				this.successMessage = 'Versión publicada correctamente.';
				this.saving = false;
				if (this.selectedTemplateId) {
					this.loadTemplateDetail(this.selectedTemplateId);
					this.loadTemplates(this.selectedTemplateId);
				}
			},
			error: (error: unknown) => {
				this.saving = false;
				this.errorMessage = this.extractErrorMessage(error);
			},
		});
	}

	getFieldTypeClass(type: EngineFormAdminField['fieldType']): string {
		switch (type) {
			case 'TEXT':
			case 'TEXTAREA':
				return 'bg-indigo-50 text-indigo-700 border-indigo-100';
			case 'NUMBER':
				return 'bg-cyan-50 text-cyan-700 border-cyan-100';
			case 'DATE':
			case 'DATETIME':
				return 'bg-emerald-50 text-emerald-700 border-emerald-100';
			case 'SELECT':
			case 'MULTISELECT':
			case 'RADIO':
				return 'bg-amber-50 text-amber-700 border-amber-100';
			default:
				return 'bg-slate-100 text-slate-700 border-slate-200';
		}
	}

	requiresOptions(fieldType: EngineFormFieldType): boolean {
		return (
			fieldType === 'SELECT' ||
			fieldType === 'MULTISELECT' ||
			fieldType === 'RADIO'
		);
	}

	private loadTemplates(selectTemplateId?: string): void {
		this.loadingTemplates = true;
		this.errorMessage = '';

		this.engineFormAdminService.listAllTemplates().subscribe({
			next: (templates) => {
				this.templates = templates;
				this.loadingTemplates = false;

				const candidateId =
					selectTemplateId ??
					this.selectedTemplateId ??
					templates[0]?.id ??
					null;

				if (candidateId) {
					this.loadTemplateDetail(candidateId);
				} else {
					this.selectedTemplateId = null;
					this.selectedTemplateDetail = null;
				}
			},
			error: (error: unknown) => {
				this.loadingTemplates = false;
				this.errorMessage = this.extractErrorMessage(error);
			},
		});
	}

	private loadTemplateDetail(templateId: string): void {
		this.loadingDetail = true;
		this.errorMessage = '';
		this.selectedTemplateId = templateId;

		this.engineFormAdminService.getTemplateDetail(templateId).subscribe({
			next: (detail) => {
				this.selectedTemplateDetail = detail;
				this.selectedVersionId = detail.activeVersionId;
				if (detail.activeVersionId) {
					this.loadVersionBlocks(detail.activeVersionId);
				} else {
					this.versionBlocks = detail.blocks;
				}
				this.loadingDetail = false;
			},
			error: (error: unknown) => {
				this.loadingDetail = false;
				this.errorMessage = this.extractErrorMessage(error);
			},
		});
	}

	private loadBlockCatalog(onLoaded?: () => void): void {
		this.loadingBlockCatalog = true;

		this.engineFormAdminService.listAllBlocks().subscribe({
			next: (blocks) => {
				this.allBlocks = blocks;
				this.loadingBlockCatalog = false;
				onLoaded?.();
			},
			error: (error: unknown) => {
				this.loadingBlockCatalog = false;
				this.errorMessage = this.extractErrorMessage(error);
			},
		});
	}

	private loadFieldCatalog(): void {
		this.loadingFieldCatalog = true;

		this.engineFormAdminService.listAllFields().subscribe({
			next: (fields) => {
				this.allFields = fields;
				this.loadingFieldCatalog = false;
			},
			error: (error: unknown) => {
				this.loadingFieldCatalog = false;
				this.errorMessage = this.extractErrorMessage(error);
			},
		});
	}

	private loadVersionBlocks(versionId: string): void {
		this.loadingVersionBlocks = true;

		this.engineFormAdminService.getVersionBlocks(versionId).subscribe({
			next: (blocks) => {
				this.versionBlocks = blocks;
				this.loadingVersionBlocks = false;
			},
			error: (error: unknown) => {
				this.loadingVersionBlocks = false;
				this.versionBlocks = [];
				this.errorMessage = this.extractErrorMessage(error);
			},
		});
	}

	private extractErrorMessage(error: unknown): string {
		if (typeof error !== 'object' || error === null) {
			return 'No fue posible completar la operación.';
		}

		if (
			'error' in error &&
			typeof (error as { error?: unknown }).error === 'object' &&
			(error as { error?: { error?: string; message?: string } }).error
		) {
			const nested = (error as { error?: { error?: string; message?: string } })
				.error;

			if (nested?.error) {
				return nested.error;
			}

			if (nested?.message) {
				return nested.message;
			}
		}

		if (
			'message' in error &&
			typeof (error as { message?: unknown }).message === 'string'
		) {
			return (error as { message: string }).message;
		}

		return 'No fue posible completar la operación.';
	}

	parseFieldOptions(value: string): CreateFieldOptionPayload[] {
		const lines = value
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		return lines.map((line, index) => {
			const [labelChunk, valueChunk, codeChunk] = line
				.split('|')
				.map((part) => part.trim());

			const payload: CreateFieldOptionPayload = {
				label: labelChunk || `Opción ${index + 1}`,
				sortOrder: index + 1,
			};

			if (valueChunk) {
				payload.value = valueChunk;
			}

			if (codeChunk) {
				payload.code = codeChunk;
			}

			return payload;
		});
	}

	private nextStatus(status: ActiveStatus): ActiveStatus {
		return status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
	}

	buildTemplateModalInitialData(): {
		code: string;
		name: string;
		description: string | null;
	} {
		return {
			code: this.templateDraft.code,
			name: this.templateDraft.name,
			description: this.templateDraft.description || null,
		};
	}

	buildBlockModalInitialData(): {
		code: string | null;
		name: string;
		description: string | null;
		sortOrder: number;
		selectedFieldIds: string[];
	} {
		return {
			code: this.blockDraft.code || null,
			name: this.blockDraft.name,
			description: this.blockDraft.description || null,
			sortOrder: this.blockDraft.sortOrder,
			selectedFieldIds: this.blockDraft.selectedFieldIds,
		};
	}

	buildFieldModalInitialData(): {
		code: string | null;
		label: string;
		fieldType: EngineFormFieldType;
		placeholder: string | null;
		isRequired: boolean;
		sortOrder: number;
		options: Array<{
			label: string;
			value: string | null;
			code: string | null;
		}>;
	} {
		return {
			code: this.fieldDraft.code || null,
			label: this.fieldDraft.label,
			fieldType: this.fieldDraft.fieldType,
			placeholder: this.fieldDraft.placeholder || null,
			isRequired: this.fieldDraft.isRequired,
			sortOrder: this.fieldDraft.sortOrder,
			options: this.parseFieldOptions(this.fieldDraft.optionsText).map(
				(option) => ({
					label: option.label,
					value: option.value ?? null,
					code: option.code ?? null,
				}),
			),
		};
	}
}
