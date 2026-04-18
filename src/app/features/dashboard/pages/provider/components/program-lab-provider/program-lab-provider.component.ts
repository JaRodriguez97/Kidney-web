import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'app-program-lab-provider',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './program-lab-provider.component.html',
	styleUrl: './program-lab-provider.component.scss',
})
export class ProgramLabProviderComponent {
	@Input() selectedDate = '';
	@Output() close = new EventEmitter<void>();

	onClose(): void {
		this.close.emit();
	}
}
