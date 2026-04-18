import { UserRole } from './user-role.type';

export interface User {
  id: string;
  email: string;
  roles: UserRole[];
  permissions?: string[];
  isActive: boolean;
  status?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  secondLastName?: string;
  documentType?: string;
  documentNumber?: string | number;
  birthDate?: string;
  gender?: string;
  phone?: string;
  countryCode?: string;
  address?: string;
  neighborhood?: string;
  commune?: string | null;
  city?: string;
  department?: string;
  emailVerified?: boolean;
  accountLocked?: boolean;
  providerId?: string;
  providerTypeId?: string;
  providerTypeCode?: string;
  providerTypeName?: string;
}
