import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-service-edit-modal',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './service-edit-modal.component.html',
	styleUrl: './service-edit-modal.component.scss',
})
export class ServiceEditModalComponent {
	@Input() visible = false;
	@Output() close = new EventEmitter<void>();

	onClose(): void {
		this.close.emit();
	}
}
