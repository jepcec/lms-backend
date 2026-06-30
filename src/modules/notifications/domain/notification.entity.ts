export type NotificationType =
  | 'nuevo_curso'
  | 'descuento'
  | 'anuncio'
  | 'completado'
  | 'recordatorio'
  | 'matriculacion'
  | 'certificado';

export class NotificationEntity {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  redirect_url?: string | null;
  created_at: Date;

  constructor(partial: Partial<NotificationEntity>) {
    Object.assign(this, partial);
  }
}
