import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

export interface StartCarePayload {
  appointmentId?: string;
  patientId?: string;
  organizationId?: string;
  careContextId?: string;
  careModalitySnapshotId?: string;
  attentionScope?: string;
  attentionEnvironment?: string;
  entryRoute?: string;
  attentionReasonCode?: string;
  triageClassification?: string;
  triageDatetime?: string;
}

export interface RegisterDiagnosisPayload {
  careId: string;
  diagnosisCodeReferenceId: string;
  diagnosisRole?: string;
  rank?: number;
  diagnosisType?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface PrescribeMedicationPayload {
  clinicalPlanId: string;
  medicationCumId?: string;
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

export interface CloseCarePayload {
  careId: string;
  dischargeCondition?: string;
  causeOfDeathCodeId?: string;
}

export interface DiagnosisSearchResult {
  id: string;
  code: string;
  name: string;
  codingSystem: string;
}

@Injectable({
  providedIn: 'root',
})
export class CareService {
  private readonly apiUrl = environment.apiUrl + 'care';

  constructor(private readonly http: HttpClient) {}

  startCare(payload: StartCarePayload): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.apiUrl}/start`, payload);
  }

  registerDiagnosis(payload: RegisterDiagnosisPayload): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.apiUrl}/diagnosis`, payload);
  }

  prescribeMedication(payload: PrescribeMedicationPayload): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.apiUrl}/prescriptions/medications`, payload);
  }

  closeCare(payload: CloseCarePayload): Observable<{ ok: boolean; rdaId?: string }> {
    return this.http.post<{ ok: boolean; rdaId?: string }>(`${this.apiUrl}/close`, payload);
  }

  searchDiagnoses(query: string, codingSystem: string = 'CIE10'): Observable<DiagnosisSearchResult[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('system', codingSystem);
    return this.http.get<DiagnosisSearchResult[]>(`${this.apiUrl}/diagnoses/search`, { params });
  }
}
