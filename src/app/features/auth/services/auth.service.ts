import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RegisterPatientRequestDto } from '../models/register-patient-request.dto';
import { LoginRequestDto } from '../models/login-request.dto';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '@env/environment';
import { User } from '@app/domains/user/user.entity';
import { UserRole } from '@app/domains/user/user-role.type';
import { PlatformService } from '@app/shared/services/platform.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = environment.apiUrl + 'auth/';
  private currentUserSubject = new BehaviorSubject<User | null>(
    this.loadUserFromStorage(),
  );

  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private platformService: PlatformService,
  ) {}

  registerPatient(payload: RegisterPatientRequestDto): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}register/patient`, payload);
  }

  login(payload: LoginRequestDto): Observable<any> {
    return this.http.post(`${this.baseUrl}login`, payload);
  }

  setSession(authResult: { accessToken: string; user: User }) {
    try {
      this.platformService.setLocalStorageItem(
        'accessToken',
        authResult.accessToken,
      );
      this.platformService.setLocalStorageItem(
        'currentUser',
        JSON.stringify(authResult.user),
      );
      this.currentUserSubject.next(authResult.user);
    } catch (e) {
      console.warn('Could not persist session', e);
    }
  }

  clearSession() {
    this.platformService.removeLocalStorageItem('accessToken');
    this.platformService.removeLocalStorageItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.platformService.getLocalStorageItem('accessToken');
  }

  hasRole(role: UserRole): boolean {
    const user = this.currentUserSubject.value;
    return !!user && user.roles.includes(role);
  }

  private loadUserFromStorage(): User | null {
    try {
      const u = this.platformService.getLocalStorageItem('currentUser');
      return u ? (JSON.parse(u) as User) : null;
    } catch (e) {
      return null;
    }
  }

  
  changePassword(
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string,
  ) {
    return this.http.post<any>(
      `${this.baseUrl}change-password`,
      {
        currentPassword,
        newPassword,
        confirmNewPassword,
      },
    );
  }
}
