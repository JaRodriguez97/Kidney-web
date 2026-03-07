import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface CreateOrganizationDto {
  organization_code: string;
  legal_name: string;
  trade_name: string;
  document_type: string;
  entity_type: string;
  document_number: string;
  address: string;
  neighborhood: string;
  city: string;
  department: string;
  country: string;
  email: string;
  password_hash: string;
  phone: string;
  website_url?: string;
  logo_url?: string;
  level_id?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private readonly baseUrl = environment.apiUrl + 'organizations/';

  constructor(private http: HttpClient) {}

  createOrganization(data: CreateOrganizationDto): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }
}
