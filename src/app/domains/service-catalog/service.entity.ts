export interface Service {
	name: string;
	subtitle?: string;
	code: string;
	serviceType:
		| 'MEDICAL_CONSULTATION'
		| 'LABORATORY'
		| 'PROCEDURE'
		| 'IMAGING'
		| 'OTHER';
	price: number;
	status: 'Activo' | 'Inactivo';
}
