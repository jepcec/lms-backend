import { Injectable, Inject } from '@nestjs/common';
import { I_USER_REPOSITORY } from '../../domain/users.repository';
import type { IUserRepository } from '../../domain/users.repository';
import { ListUsuariosDto } from '../dtos/list-usuarios.dto';

@Injectable()
export class ListUsuariosUseCase {
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(params: ListUsuariosDto) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;

    const { data, total } = await this.userRepository.findAll({
      page,
      limit,
      search: params.search,
      role: params.role,
      status: params.status,
    });

    const users = data.map((user) => ({
      id: user.id,
      first_name: user.first_name,
      last_name: user.lastName,
      email: user.email,
      phone: user.phone,
      country: user.country,
      role: user.role,
      profile_photo_url: user.profilePhotoUrl,
      email_verified: user.emailVerified,
      status: user.status,
      created_by: user.createdBy,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    }));

    return {
      data: users,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }
}
