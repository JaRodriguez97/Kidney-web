import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { OrganizationService } from '@app/core/services/organization.service';
import { DatePipe, NgClass} from '@angular/common';

@Component({
	selector: 'app-patient-detail-modal',
	standalone: true,
	imports: [NgClass, DatePipe],
	templateUrl: './patient-detail-modal.component.html',
	styleUrl: './patient-detail-modal.component.scss',
})
export class PatientDetailModalComponent implements OnInit {
	private readonly organizationService = inject(OrganizationService);

	@Input() patientId!: string;
	@Output() close = new EventEmitter<void>();

	loading = true;
	patient: any = null;

	ngOnInit(): void {
		if (this.patientId) {
			this.loadPatientDetail();
		}
	}

	loadPatientDetail(): void {
		this.loading = true;
		this.organizationService.getPatientDetail(this.patientId).subscribe({
			next: (data) => {
				this.patient = data;
				this.loading = false;
			},
			error: (error) => {
				console.error('Error loading patient detail', error);
				this.loading = false;
			},
		});
	}

	closeModal(): void {
		this.close.emit();
	}

	getInitials(name: string): string {
		if (!name) return 'UN';
		const parts = name.split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return parts[0].substring(0, 2).toUpperCase();
	}
}
