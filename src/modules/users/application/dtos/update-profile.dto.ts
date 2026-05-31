// modules/users/application/dtos/update-profile.dto.ts
export class UpdateProfileDto {
  first_name?: string;
  last_name?: string;
  phone?: string;
  country?: string;
  profile_photo_url?: string; // Solo declaramos el tipo para TypeScript
}
