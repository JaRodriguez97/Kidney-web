export interface ProviderType {
	id: string;
	code: string;
	name: string;
	description?: string;
	requiresProfessionalLicense: boolean;
	permissionIds: string[];
}

export interface CreateProviderTypeRequest {
	code: string;
	name: string;
	description?: string;
	requiresProfessionalLicense?: boolean;
	permissionIds?: string[];
}
