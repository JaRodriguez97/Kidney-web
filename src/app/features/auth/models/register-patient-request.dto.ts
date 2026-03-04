export interface RegisterPatientRequestDto {
  email: string;
  password: string;
  firstName: string;
  secondName?: string;
  lastName: string;
  secondLastName?: string;
  number_document?: string;
  phone?: string;
  address?: string;
  barrio?: string;
  comuna?: number;
  city: string;
}
