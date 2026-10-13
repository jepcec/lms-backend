import { IsIn, IsOptional } from 'class-validator';

export type UserRole =
  | 'estudiante'
  | 'soporte'
  | 'marketing'
  | 'admin'
  | 'coordinador';

const USER_ROLES: UserRole[] = [
  'estudiante',
  'soporte',
  'marketing',
  'admin',
  'coordinador',
];

export class UpdateUsuarioDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  country?: string;
  @IsOptional()
  @IsIn(USER_ROLES)
  role?: UserRole;
  password?: string;
}
