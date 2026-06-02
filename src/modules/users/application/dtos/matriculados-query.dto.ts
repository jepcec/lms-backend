export class MatriculadosQueryDto {
  page?: number = 1;
  limit?: number = 10;
  search?: string;
  status?: string;
  enrollment_type?: string;
}
