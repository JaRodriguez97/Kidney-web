import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import {
	CreateServicePackageInput,
	ServicePackage,
	UpdateServicePackageInput,
} from '@app/domains/service-catalog/service-package.entity';
import { map, Observable } from 'rxjs';

interface BackendPackageItem {
	id: string;
	service_id: string;
	quantity: number;
	is_mandatory: boolean;
	sort_order: number | null;
	service?: {
		id: string;
		code: string;
		name: string;
	};
}

interface BackendPackagePrice {
	id: string;
	amount: string | number;
	currency: string;
	is_default: boolean;
}

interface BackendPackage {
	id: string;
	code: string;
	name: string;
	description: string | null;
	package_category_id: string | null;
	is_schedulable: boolean;
	allow_partial_usage: boolean;
	status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
	created_at: string;
	service_package_item: BackendPackageItem[];
	service_package_price: BackendPackagePrice[];
}

@Injectable({
	providedIn: 'root',
})
export class ServicePackageService {
	private readonly API_URL = environment.apiUrl + 'packages';

	constructor(private readonly http: HttpClient) {}

	getPackages(): Observable<ServicePackage[]> {
		return this.http
			.get<{ success: boolean; data: BackendPackage[] }>(this.API_URL)
			.pipe(
				map((response) => response.data.map((item) => this.mapPackage(item))),
			);
	}

	getPackageById(id: string): Observable<ServicePackage> {
		return this.http
			.get<{ success: boolean; data: BackendPackage }>(`${this.API_URL}/${id}`)
			.pipe(map((response) => this.mapPackage(response.data)));
	}

	createPackage(dto: CreateServicePackageInput): Observable<ServicePackage> {
		return this.http
			.post<{ success: boolean; data: BackendPackage }>(this.API_URL, dto)
			.pipe(map((response) => this.mapPackage(response.data)));
	}

	updatePackage(
		id: string,
		dto: UpdateServicePackageInput,
	): Observable<ServicePackage> {
		return this.http
			.patch<{
				success: boolean;
				data: BackendPackage;
			}>(`${this.API_URL}/${id}`, dto)
			.pipe(map((response) => this.mapPackage(response.data)));
	}

	updateStatus(
		id: string,
		payload: { status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE'; softDelete?: boolean },
	): Observable<ServicePackage | null> {
		return this.http
			.patch<{
				success: boolean;
				data: BackendPackage | null;
			}>(`${this.API_URL}/${id}/status`, payload)
			.pipe(
				map((response) =>
					response.data ? this.mapPackage(response.data) : null,
				),
			);
	}

	private mapPackage(item: BackendPackage): ServicePackage {
		return {
			id: item.id,
			code: item.code,
			name: item.name,
			description: item.description || undefined,
			packageCategoryId: item.package_category_id || undefined,
			status: item.status,
			isSchedulable: item.is_schedulable,
			allowPartialUsage: item.allow_partial_usage,
			createdAt: item.created_at,
			items: item.service_package_item.map((serviceItem) => ({
				id: serviceItem.id,
				serviceId: serviceItem.service_id,
				serviceCode: serviceItem.service?.code,
				serviceName: serviceItem.service?.name,
				quantity: serviceItem.quantity,
				unitPrice: 0,
				isMandatory: serviceItem.is_mandatory,
				sortOrder: serviceItem.sort_order || undefined,
			})),
			prices: item.service_package_price.map((price) => ({
				id: price.id,
				amount: Number(price.amount),
				currency: price.currency,
				isDefault: price.is_default,
			})),
		};
	}
}
