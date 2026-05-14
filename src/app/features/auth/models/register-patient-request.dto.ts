export interface RegisterPatientRequestDto {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  documentType?:
    | 'CC'
    | 'CE'
    | 'TI'
    | 'RC'
    | 'NUIP'
    | 'NIT'
    | 'PASSPORT'
    | 'PPT'
    | 'PEP'
    | 'CDI'
    | 'SC'
    | 'AS'
    | 'MS'
    | 'CN';
  documentNumber?: string;
  phone?: string;
  address?: string;
  neighborhood?: string;
  commune?: number;
  city?: string;
  department?: string;
}
