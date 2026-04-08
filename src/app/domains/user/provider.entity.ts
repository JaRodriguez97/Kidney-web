export interface ProviderSpecialty {
	id: string;
	name: string;
	isPrimary: boolean;
}

export interface ProviderProfile {
	professionalTitle: string | null;
	biography: string | null;
	yearsOfExperience: number | null;
	profilePhotoUrl: string | null;
}

export interface Provider {
	id: string;
	providerCode: string | null;
	providerType: {
		id: string;
		code: string;
		name: string;
	};
	professionalLicenseNumber: string | null;
	status: string;
	isAvailableForTelemedicine: boolean;
	user: {
		id: string;
		email: string;
		firstName?: string;
		lastName?: string;
	};
	profile: ProviderProfile;
	specialties: ProviderSpecialty[];
	createdAt: string;
}
