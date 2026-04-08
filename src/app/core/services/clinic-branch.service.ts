import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface ClinicBranchResponse {
	id: string;
	code: string;
	name: string;
	address: string;
	city: string;
	department: string;
	phone?: string;
	email?: string;
	is_main: boolean;
	status: string;
}

@Injectable({
	providedIn: 'root',
})
export class ClinicBranchService {
	private readonly API_URL = environment.apiUrl + 'clinic-branches';

	constructor(private http: HttpClient) {}

	getClinicBranches(): Observable<ClinicBranchResponse[]> {
		return this.http
			.get<{ success: boolean; data: ClinicBranchResponse[] }>(this.API_URL)
			.pipe(map((response) => response.data));
	}

	createClinicBranch(branch: {
		code: string;
		name: string;
		address: string;
		city: string;
		department: string;
		neighborhood?: string;
		phone?: string;
		email?: string;
		is_main?: boolean;
	}): Observable<ClinicBranchResponse> {
		return this.http
			.post<{
				success: boolean;
				data: ClinicBranchResponse;
			}>(this.API_URL, branch)
			.pipe(map((response) => response.data));
	}
}
