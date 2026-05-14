export type PackageStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

export interface ServicePackageItem {
	id: string;
	serviceId: string;
	serviceCode?: string;
	serviceName?: string;
	quantity: number;
	unitPrice: number;
	isMandatory: boolean;
	sortOrder?: number;
}

export interface ServicePackagePrice {
	id: string;
	amount: number;
	currency: string;
	isDefault: boolean;
}

export interface ServicePackage {
	id: string;
	code: string;
	name: string;
	description?: string;
	status: PackageStatus;
	packageCategoryId?: string;
	isSchedulable: boolean;
	allowPartialUsage: boolean;
	items: ServicePackageItem[];
	prices: ServicePackagePrice[];
	createdAt: string;
}

export interface CreateServicePackageItemInput {
	serviceId: string;
	quantity: number;
	unitPrice: number;
	isMandatory?: boolean;
}

export interface CreateServicePackageInput {
	code?: string;
	name: string;
	description?: string;
	packageCategoryId?: string;
	isSchedulable?: boolean;
	allowPartialUsage?: boolean;
	items: CreateServicePackageItemInput[];
	finalPrice: number;
	currency?: string;
}

export interface UpdateServicePackageInput {
	code?: string;
	name?: string;
	description?: string;
	packageCategoryId?: string | null;
	isSchedulable?: boolean;
	allowPartialUsage?: boolean;
	status?: PackageStatus;
	items?: CreateServicePackageItemInput[];
	finalPrice?: number;
	currency?: string;
}
