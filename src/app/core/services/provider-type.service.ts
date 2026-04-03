import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
	CreateProviderTypeRequest,
	ProviderType,
} from '@app/domains/user/provider-type.entity';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ProviderTypeService {
	private readonly baseUrl = environment.apiUrl + 'providers/types/';

	constructor(private http: HttpClient) {}

	getProviderTypes(): Observable<ProviderType[]> {
		return this.http.get<ProviderType[]>(this.baseUrl);
	}

	createProviderType(dto: CreateProviderTypeRequest): Observable<ProviderType> {
		return this.http.post<ProviderType>(this.baseUrl, dto);
	}
}
