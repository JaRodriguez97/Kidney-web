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
	slotId: string;
	serviceId: string;
	providerId: string;
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

export interface ProviderAgendaItem {
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
	serviceId: string;
	serviceName: string;
	clinicBranchName: string;
	providerId: string;
	providerName: string | null;
	patientId: string;
	patientName: string;
	notes: string | null;
}

export interface GetProviderAgendaResponse {
	date: string;
	month: string;
	scope: 'GLOBAL' | 'SELF';
	selectedProviderId: string | null;
	appointments: ProviderAgendaItem[];
	calendarDays: ProviderAgendaCalendarDay[];
	stats: ProviderAgendaStats;
	alerts: ProviderAgendaAlert[];
}

export interface ProviderAgendaCalendarDay {
	date: string;
	appointments: number;
}

export interface ProviderAgendaStats {
	totalMonthAppointments: number;
	confirmedCount: number;
	inProgressCount: number;
	cancelledCount: number;
	pendingCount: number;
}

export interface ProviderAgendaAlert {
	id: string;
	type: 'PENDING_CONFIRMATION' | 'NO_SHOW' | 'FOLLOW_UP';
	severity: 'MEDIUM' | 'HIGH';
	title: string;
	description: string;
	patientId?: string | null;
	appointmentId?: string | null;
}

export type ProviderAppointmentStatusAction =
	| 'CONFIRM'
	| 'CALL'
	| 'START'
	| 'CANCEL';

export interface ProviderUpdateAppointmentStatusRequest {
	action: ProviderAppointmentStatusAction;
	cancellationReason?: string;
}

export interface ProviderUpdateAppointmentStatusResponse {
	appointment: {
		id: string;
		status: ProviderAgendaItem['status'];
	};
}

export interface RescheduleAppointmentRequest {
	newSlotId: string;
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

	getProviderAgenda(
		date?: string,
		providerId?: string,
		month?: string,
	): Observable<GetProviderAgendaResponse> {
		let params = new HttpParams();

		if (date) {
			params = params.set('date', date);
		}

		if (providerId) {
			params = params.set('providerId', providerId);
		}

		if (month) {
			params = params.set('month', month);
		}

		return this.http.get<GetProviderAgendaResponse>(
			`${this.apiUrl}/provider-agenda`,
			{ params },
		);
	}

	updateProviderAppointmentStatus(
		appointmentId: string,
		payload: ProviderUpdateAppointmentStatusRequest,
	): Observable<ProviderUpdateAppointmentStatusResponse> {
		return this.http.patch<ProviderUpdateAppointmentStatusResponse>(
			`${this.apiUrl}/${appointmentId}/provider-status`,
			payload,
		);
	}

	rescheduleProviderAppointment(
		appointmentId: string,
		payload: RescheduleAppointmentRequest,
	): Observable<unknown> {
		return this.http.patch(`${this.apiUrl}/${appointmentId}/provider-reschedule`, payload);
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
