export interface Service {
	id?: string;
	name: string;
	subtitle?: string;
	code: string;
	serviceType:
		| 'MEDICAL_CONSULTATION'
		| 'NURSING'
		| 'NUTRITION'
		| 'PSYCHOLOGY'
		| 'SOCIAL_WORK'
		| 'REHABILITATION'
		| 'PHARMACY'
		| 'TELEMEDICINE'
		| 'LABORATORY'
		| 'PROCEDURE'
		| 'IMAGING'
		| 'OTHER';
	price?: number;
	description?: string;
	isActive?: boolean;
	status: 'Activo' | 'Inactivo';
}
