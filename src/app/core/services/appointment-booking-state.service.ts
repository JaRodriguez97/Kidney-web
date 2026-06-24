import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppointmentBookingState {
	specialty: string | null;
	serviceId: string | null;
	serviceCode: string | null;
	serviceName: string | null;
	providerId: string | null;
	providerName: string | null;
	slotId: string | null;
	slotDate: string | null;
	slotStartTime: string | null;
	slotEndTime: string | null;
	careModalityId: string | null;
	careModalityCode: string | null;
	careModalityName: string | null;
}

const INITIAL_STATE: AppointmentBookingState = {
	specialty: null,
	serviceId: null,
	serviceCode: null,
	serviceName: null,
	providerId: null,
	providerName: null,
	slotId: null,
	slotDate: null,
	slotStartTime: null,
	slotEndTime: null,
	careModalityId: null,
	careModalityCode: null,
	careModalityName: null,
};

@Injectable({
	providedIn: 'root',
})
export class AppointmentBookingStateService {
	private readonly stateSubject = new BehaviorSubject<AppointmentBookingState>(
		INITIAL_STATE,
	);

	readonly state$ = this.stateSubject.asObservable();

	getSnapshot(): AppointmentBookingState {
		return this.stateSubject.value;
	}

	setServiceSelection(payload: {
		specialty: string;
		serviceId: string;
		serviceCode: string;
		serviceName: string;
	}): void {
		this.stateSubject.next({
			...this.stateSubject.value,
			specialty: payload.specialty,
			serviceId: payload.serviceId,
			serviceCode: payload.serviceCode,
			serviceName: payload.serviceName,
			providerId: null,
			providerName: null,
			slotId: null,
			slotDate: null,
			slotStartTime: null,
			slotEndTime: null,
		});
	}

	setProviderSelection(payload: {
		providerId: string;
		providerName: string;
	}): void {
		this.stateSubject.next({
			...this.stateSubject.value,
			providerId: payload.providerId,
			providerName: payload.providerName,
			slotId: null,
			slotDate: null,
			slotStartTime: null,
			slotEndTime: null,
		});
	}

	setSlotSelection(payload: {
		slotId: string | null;
		slotDate: string;
		slotStartTime: string;
		slotEndTime: string;
	}): void {
		this.stateSubject.next({
			...this.stateSubject.value,
			slotId: payload.slotId,
			slotDate: payload.slotDate,
			slotStartTime: payload.slotStartTime,
			slotEndTime: payload.slotEndTime,
		});
	}

	setCareModalitySelection(payload: {
		careModalityId: string;
		careModalityCode: string;
		careModalityName: string;
	}): void {
		this.stateSubject.next({
			...this.stateSubject.value,
			careModalityId: payload.careModalityId,
			careModalityCode: payload.careModalityCode,
			careModalityName: payload.careModalityName,
		});
	}

	clear(): void {
		this.stateSubject.next(INITIAL_STATE);
	}
}
