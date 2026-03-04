import { UserRole } from './user-role.type';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}
