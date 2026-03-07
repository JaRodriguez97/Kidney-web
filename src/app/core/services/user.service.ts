import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UpdateUserDto } from '@app/domains/user/user-update.entity';
import { User } from '@app/domains/user/user.entity';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

export interface AdminUserRequest {
  email: string;
  password: string;
  roleNames: string[];
  firstName: string;
  lastName: string;
  documentNumber?: string;
  phone?: string;
}

export interface ProviderUserRequest {
  email: string;
  password: string;
  roleNames: string[];
  firstName: string;
  lastName: string;
  documentNumber?: string;
  phone?: string;
  specialty?: string;
  licenseNumber?: string;
}

export interface OrganizationUserRequest {
  legal_name: string;
  document_number: string;
  email: string;
  password_hash: string;
  entity_type: string;
  phone?: string;
  address?: string;
  website_url?: string;
  neighborhood?: string;
  commune?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly baseUrl = environment.apiUrl + 'users/';
  private readonly baseUrlOrg = environment.apiUrl + 'organizations/';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de todos los usuarios
   */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}`);
  }

  /**
   * Obtiene un usuario por su ID
   */
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}${id}`);
  }

  /**
   * Crea un nuevo usuario (Admin o Provider)
   */
  createUser(opt: {
    admin?: AdminUserRequest;
    provider?: ProviderUserRequest;
    organization?: OrganizationUserRequest;
  }): Observable<User> {
    let user: any = opt.admin
      ? opt.admin
      : opt.provider
        ? opt.provider
        : opt.organization;

    return this.http.post<User>(this.baseUrl, user);
  }
  /**
   * Crea un nuevo usuario (Admin o Provider)
   */
  createOrganization(organization?: OrganizationUserRequest): Observable<{
    success: true;
    data: {
      id: string;
      organization_code: string;
      legal_name: string;
      email: string;
      entity_type: string | null;
      status: string;
    };
  }> {
    return this.http.post<{
      success: true;
      data: {
        id: string;
        organization_code: string;
        legal_name: string;
        email: string;
        entity_type: string | null;
        status: string;
      };
    }>(this.baseUrlOrg, organization);
  }

  /**
   * Actualiza un usuario existente
   */
  updateUser(id: string, dto: UpdateUserDto): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}${id}`, dto);
  }

  /**
   * Elimina un usuario
   */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}`);
  }
  /**
   * Obtiene los datos del usuario autenticado
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}me`);
  }
}
