import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

export interface JoinByAppointmentResponse {
	message: string;
	sessionId: string;
	accessToken: string;
	joinUrl: string;
	status: string;
	created: boolean;
}

export interface SessionAccessResponse {
	sessionId: string;
	status: string;
	role: 'PROVIDER' | 'PATIENT';
	roomName: string;
	scheduledStartAt: string;
	scheduledEndAt: string;
	actualStartAt?: string | null;
	patientDetails?: {
		id: string;
		name: string;
		documentType: string;
		documentNumber: string;
		age: number | null;
		riskIntegral: string;
		bloodType: string;
		allergies: string;
	};
	providerDetails?: {
		id: string;
		name: string;
		specialty: string;
	};
	appointmentId?: string;
	serviceId?: string;
	serviceName?: string;
}

export type TeleconsultationSessionStatus =
	| 'WAITING'
	| 'IN_PROGRESS'
	| 'COMPLETED'
	| 'CANCELLED'
	| 'NO_SHOW';

@Injectable({
	providedIn: 'root',
})
export class TelemedicineService {
	private readonly apiUrl = environment.apiUrl + 'telemedicine';

	constructor(private readonly http: HttpClient) {}

	joinByAppointment(
		appointmentId: string,
	): Observable<JoinByAppointmentResponse> {
		return this.http.post<JoinByAppointmentResponse>(
			`${this.apiUrl}/sessions/join-by-appointment/${appointmentId}`,
			{},
		);
	}

	getSessionAccess(
		sessionId: string,
		token: string,
	): Observable<SessionAccessResponse> {
		const params = new HttpParams().set('token', token);
		return this.http.get<SessionAccessResponse>(
			`${this.apiUrl}/sessions/${sessionId}/access`,
			{ params },
		);
	}

	updateSessionStatus(
		sessionId: string,
		status: TeleconsultationSessionStatus,
	): Observable<unknown> {
		return this.http.patch(`${this.apiUrl}/sessions/${sessionId}/status`, {
			status,
		});
	}
}
