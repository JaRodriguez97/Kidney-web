import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@app/domains/user/user.entity';

@Component({
	selector: 'app-request-details-modal',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './request-details-modal.component.html',
	styleUrl: './request-details-modal.component.scss',
})
export class RequestDetailsModalComponent {
	@Input({ required: true }) request!: User;
	@Output() close = new EventEmitter<void>();
	@Output() approve = new EventEmitter<User>();
	@Output() reject = new EventEmitter<User>();

	onClose(): void {
		this.close.emit();
	}

	onApprove(): void {
		this.approve.emit(this.request);
	}

	onReject(): void {
		this.reject.emit(this.request);
	}
}
