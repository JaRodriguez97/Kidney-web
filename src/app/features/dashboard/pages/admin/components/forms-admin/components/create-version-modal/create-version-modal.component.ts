import { CommonModule } from '@angular/common';
import {
	Component,
	EventEmitter,
	Input,
	OnChanges,
	Output,
	SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EngineFormAdminBlockCatalogItem } from '@app/core/services/engine-form-admin.service';

export interface CreateVersionModalSubmit {
	releaseNotes: string | null;
	blockIds: string[];
}

@Component({
	selector: 'app-create-version-modal',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './create-version-modal.component.html',
})
export class CreateVersionModalComponent implements OnChanges {
	@Input() visible = false;
	@Input() loading = false;
	@Input() availableBlocks: EngineFormAdminBlockCatalogItem[] = [];
	@Input() preSelectedBlockIds: string[] = [];

	@Output() close = new EventEmitter<void>();
	@Output() save = new EventEmitter<CreateVersionModalSubmit>();

	releaseNotes = '';
	selection = new Set<string>();
	errorMessage = '';

	ngOnChanges(changes: SimpleChanges): void {
		const visibleChange = changes['visible'];
		if (!visibleChange || !visibleChange.currentValue) {
			return;
		}

		this.releaseNotes = '';
		this.errorMessage = '';
		this.selection = new Set(this.preSelectedBlockIds);
	}

	trackByBlock(_: number, block: EngineFormAdminBlockCatalogItem): string {
		return block.id;
	}

	isSelected(blockId: string): boolean {
		return this.selection.has(blockId);
	}

	toggleSelection(blockId: string, checked: boolean): void {
		if (checked) {
			this.selection.add(blockId);
			return;
		}

		this.selection.delete(blockId);
	}

	onClose(): void {
		if (this.loading) {
			return;
		}

		this.close.emit();
	}

	onSubmit(): void {
		if (this.selection.size === 0) {
			this.errorMessage = 'Selecciona al menos un bloque para crear la versión.';
			return;
		}

		this.errorMessage = '';
		this.save.emit({
			releaseNotes: this.releaseNotes.trim() ? this.releaseNotes.trim() : null,
			blockIds: Array.from(this.selection),
		});
	}
}
