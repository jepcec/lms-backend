// modules/users/application/dtos/update-profile.dto.ts
export class UpdateProfileDto {
  first_name?: string;
  last_name?: string;
  phone?: string;
  country?: string;
  profile_photo_url?: string;
  
  // Para el cambio de contraseña [cite: 123, 127, 128]
  current_password?: string;
  new_password?: string;
}