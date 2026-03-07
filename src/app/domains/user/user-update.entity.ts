export interface UpdateUserDto {
  targetUserId: string;

  currentUser: {
    id: string;
    roles: string[];
  };

  userData?: {
    email?: string;
    status?: string;
    password?: string;
  };

  profileData?: {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    second_last_name?: string;
    document_type?: string;
    document_number?: string;
    birth_date?: Date | string;
    gender?: string;
    phone?: string;
    country_code?: string;
    address?: string;
    neighborhood?: string;
    commune?: number;
    city?: string;
    department?: string;
  };

  roles?: string[];
}
