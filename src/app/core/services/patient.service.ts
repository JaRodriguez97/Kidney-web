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

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private readonly baseUrl = environment.apiUrl + 'patients/';

  constructor(private http: HttpClient) {}

  createPatient(patient: PatientRequest): Observable<any> {
    return this.http.post(this.baseUrl, patient);
  }
}
