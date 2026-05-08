export class AddItemDto {
  course_id!: string; // UUID del curso
  user_id?: string;  // Opcional si es invitado
  session_token?: string; // Para persistencia de invitados
}