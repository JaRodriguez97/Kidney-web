import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

export interface AvailableSlot {
	id: string;
	providerId: string;
	clinicBranchId: string;
	slotDate: string;
	startTime: string;
	endTime: string;
	capacity: number;
	bookedCount: number;
	available: number;
	status: string;
}

export interface GetBookedTimesResponse {
	bookedTimes: string[];
}

export interface CreateAppointmentRequest {
	serviceId: string;
	providerId: string;
	date: string;
	startTime: string;
	endTime: string;
	paymentRequired?: boolean;
	notes?: string;
}

export interface PatientAppointment {
	id: string;
	scheduledDate: string;
	startTime: string;
	endTime: string;
	status:
		| 'PENDING_PAYMENT'
		| 'CONFIRMED'
		| 'CHECKED_IN'
		| 'IN_PROGRESS'
		| 'COMPLETED'
		| 'CANCELLED'
		| 'NO_SHOW'
		| 'RESCHEDULED';
	serviceName: string;
	providerName: string | null;
	careModality: string | null;
	clinicBranchName: string;
	notes: string | null;
}

export interface GetPatientAppointmentsResponse {
	appointments: PatientAppointment[];
}

@Injectable({
	providedIn: 'root',
})
export class AppointmentService {
	private readonly apiUrl = environment.apiUrl + 'appointments';

	constructor(private readonly http: HttpClient) {}

	getAvailableSlots(
		providerId: string,
		serviceId: string,
		date: string,
	): Observable<AvailableSlot[]> {
		const params = new HttpParams()
			.set('providerId', providerId)
			.set('serviceId', serviceId)
			.set('date', date);

		return this.http.get<AvailableSlot[]>(`${this.apiUrl}/slots`, { params });
	}

	getMyAppointments(): Observable<GetPatientAppointmentsResponse> {
		return this.http.get<GetPatientAppointmentsResponse>(
			`${this.apiUrl}/my-appointments`,
		);
	}

	getBookedTimes(
		providerId: string,
		date: string,
	): Observable<GetBookedTimesResponse> {
		const params = new HttpParams()
			.set('providerId', providerId)
			.set('date', date);
		return this.http.get<GetBookedTimesResponse>(
			`${this.apiUrl}/booked-times`,
			{
				params,
			},
		);
	}

	createAppointment(payload: CreateAppointmentRequest): Observable<unknown> {
		return this.http.post(`${this.apiUrl}`, payload);
	}
}
