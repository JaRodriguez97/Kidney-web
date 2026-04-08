import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Provider } from '@app/domains/user/provider.entity';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ProviderService {
	private readonly apiUrl = environment.apiUrl + 'providers';

	constructor(private readonly http: HttpClient) {}

	getProviders(params?: {
		serviceId?: string | null;
		specialty?: string | null;
	}): Observable<Provider[]> {
		let httpParams = new HttpParams();

		if (params?.serviceId) {
			httpParams = httpParams.set('serviceId', params.serviceId);
		}

		if (params?.specialty) {
			httpParams = httpParams.set('specialty', params.specialty);
		}

		return this.http.get<Provider[]>(this.apiUrl, { params: httpParams });
	}
}
