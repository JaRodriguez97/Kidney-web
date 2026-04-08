import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UpdateUserDto } from '@app/domains/user/user-update.entity';
import { User } from '@app/domains/user/user.entity';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

export interface AdminUserRequest {
	email: string;
	password: string;
	roleNames: string[];
	firstName: string;
	lastName: string;
	documentNumber?: string;
	phone?: string;
}

export interface ProviderUserRequest {
	email: string;
	password: string;
	roleNames: string[];
	firstName: string;
	lastName: string;
	documentNumber?: string;
	phone?: string;
	specialty?: string;
	licenseNumber?: string;
}

export interface ScheduleAvailabilityBlock {
	dayOfWeek: number; // 0-6 (Mon-Sun)
	startTime: string; // HH:mm format
	endTime: string; // HH:mm format
	slotIntervalMinutes: number;
	maxOverbook?: number;
}

export interface ScheduleData {
	clinicBranchId: string;
	name: string;
	startDate: string; // YYYY-MM-DD
	endDate?: string;
	availabilityBlocks: ScheduleAvailabilityBlock[];
	generateSlotsUntil?: string;
}

export interface CreateProviderRequest {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	providerTypeId: string;
	documentType: string;
	documentNumber: string;
	professionalLicenseNumber?: string;
	middleName?: string;
	secondLastName?: string;
	phone?: string;
	gender?: string;
	neighborhood?: string;
	address?: string;
	commune?: number;
	schedule?: ScheduleData;
}

export interface OrganizationUserRequest {
	legal_name: string;
	document_number: string;
	email: string;
	password_hash: string;
	entity_type: string;
	phone?: string;
	address?: string;
	website_url?: string;
	neighborhood?: string;
	commune?: string;
}

@Injectable({
	providedIn: 'root',
})
export class UserService {
	private readonly baseUrl = environment.apiUrl + 'users/';
	private readonly baseUrlOrg = environment.apiUrl + 'organizations/';
	private readonly baseUrlProviders = environment.apiUrl + 'providers/';

	constructor(private http: HttpClient) {}

	/**
	 * Obtiene la lista de todos los usuarios
	 */
	getUsers(): Observable<User[]> {
		return this.http.get<User[]>(`${this.baseUrl}`);
	}

	/**
	 * Obtiene un usuario por su ID
	 */
	getUserById(id: string): Observable<User> {
		return this.http.get<User>(`${this.baseUrl}${id}`);
	}

	/**
	 * Crea un nuevo usuario (Admin, Patient o Provider)
	 */
	createUser(opt: {
		admin?: AdminUserRequest;
		patient?: AdminUserRequest;
		provider?: ProviderUserRequest;
		organization?: OrganizationUserRequest;
	}): Observable<User> {
		let user: any = opt.admin
			? opt.admin
			: opt.patient
				? opt.patient
				: opt.provider
					? opt.provider
					: opt.organization;

		return this.http.post<User>(this.baseUrl, user);
	}
	/**
	 * Crea un nuevo usuario (Admin o Provider)
	 */
	createOrganization(organization?: OrganizationUserRequest): Observable<{
		success: true;
		data: {
			id: string;
			organization_code: string;
			legal_name: string;
			email: string;
			entity_type: string | null;
			status: string;
		};
	}> {
		return this.http.post<{
			success: true;
			data: {
				id: string;
				organization_code: string;
				legal_name: string;
				email: string;
				entity_type: string | null;
				status: string;
			};
		}>(this.baseUrlOrg, organization);
	}

	/**
	 * Crea un nuevo proveedor de servicios
	 */
	createProvider(dto: CreateProviderRequest): Observable<any> {
		return this.http.post<any>(this.baseUrlProviders, dto);
	}

	/**
	 * Actualiza un usuario existente
	 */
	updateUser(id: string, dto: UpdateUserDto): Observable<User> {
		return this.http.patch<User>(`${this.baseUrl}${id}`, dto);
	}

	/**
	 * Elimina un usuario
	 */
	deleteUser(id: string): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}${id}`);
	}
	/**
	 * Obtiene los datos del usuario autenticado
	 */
	getCurrentUser(): Observable<User> {
		return this.http.get<User>(`${this.baseUrl}me`);
	}
}
