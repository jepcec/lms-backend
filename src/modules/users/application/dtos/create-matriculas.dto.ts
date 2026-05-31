export class CreateMatriculasDto {
  user_id: string;
  course_ids: string[];
  offline_payment_method: 'transferencia' | 'efectivo' | 'cortesia' | 'otro';
  offline_amount?: number;
  internal_notes?: string;
}
