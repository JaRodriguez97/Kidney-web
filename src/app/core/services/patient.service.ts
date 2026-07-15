import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface PatientRequest {
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  heightCm?: number;
  weightKg?: number;
  phone?: string;
  email: string;
  address?: string;
  city?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export type ProviderPatientRisk = 'HIGH' | 'MODERATE' | 'LOW' | 'UNCLASSIFIED';

export interface ProviderDashboardPatient {
  patientId: string;
  fullName: string;
  documentType: string | null;
  lastAttentionDate: string;
  riskLevel: ProviderPatientRisk;
  totalAppointments: number;
}

export interface ProviderPatientsResponse {
  scope: 'GLOBAL' | 'SELF';
  selectedProviderId: string | null;
  stats: {
    totalPatients: number;
    highRiskPatients: number;
    moderateRiskPatients: number;
    lowRiskPatients: number;
    unclassifiedRiskPatients: number;
  };
  patients: ProviderDashboardPatient[];
}

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private readonly baseUrl = environment.apiUrl + 'patients/';

  constructor(private http: HttpClient) {}

  createPatient(patient: PatientRequest): Observable<any> {
    return this.http.post(this.baseUrl, patient);
  }

  getProviderPatients(params?: {
    providerId?: string;
    search?: string;
    risk?: ProviderPatientRisk;
  }): Observable<ProviderPatientsResponse> {
    return this.http.get<ProviderPatientsResponse>(
      `${this.baseUrl}provider-dashboard`,
      {
        params: {
          ...(params?.providerId ? { providerId: params.providerId } : {}),
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.risk ? { risk: params.risk } : {}),
        },
      },
    );
  }

  getMyProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}my-profile`);
  }

  updateMyProfile(payload: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}me`, payload);
  }

  getMyDocuments(): Observable<PatientDocument[]> {
    return this.http.get<PatientDocument[]>(`${this.baseUrl}my-documents`);
  }
}

export interface PatientDocument {
  id: string;
  type: 'INCAPACITY' | 'REFERRAL' | 'LAB' | 'CERTIFICATE' | 'INVOICE';
  title: string;
  date: string;
  issuer: string;
  details: string;
  downloadParam: string;
}
