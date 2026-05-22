import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
	selector: 'app-payment-result',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './payment-result.component.html',
	styleUrl: './payment-result.component.scss',
})
export class PaymentResultComponent implements OnInit {
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);

	status = 'PENDING';
	reference = '';

	ngOnInit(): void {
		this.status = (
			this.route.snapshot.queryParamMap.get('status') ?? 'PENDING'
		).toUpperCase();
		this.reference = this.route.snapshot.queryParamMap.get('ref') ?? '';
	}

	goToAppointments(): void {
		this.router.navigate(['/dashboard/patient/appointments']);
	}
}
