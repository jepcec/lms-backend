import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  I_STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../domain/staff-members.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { CreateStaffMemberDto } from '../dtos/create-staff-member.dto';

@Injectable()
export class CreateStaffMemberUseCase {
  constructor(
    @Inject(I_STAFF_MEMBER_REPOSITORY)
    private readonly staffRepository: IStaffMemberRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(dto: CreateStaffMemberDto) {
    if (!dto.image && !dto.image_url) {
      throw new BadRequestException('Se requiere una imagen');
    }

    let imageUrl = dto.image_url;
    let imagePublicId = dto.image_public_id;

    if (dto.image) {
      const result = await this.fileStorageService.upload({
        buffer: dto.image.buffer,
        originalName: dto.image.originalname,
        mimetype: dto.image.mimetype,
        folder: 'staff',
      });
      imageUrl = this.fileStorageService.getUrl(result.publicId, {
        format: 'webp',
      });
      imagePublicId = result.publicId;
    }

    // 🚀 Pasamos todos los datos y aseguramos que image_url sea string
    return this.staffRepository.create({
      full_name: dto.full_name ?? null,
      title: dto.title ?? null,
      description: dto.description ?? null,
      image_url: imageUrl ?? '', // 👈 Evita el error 'string | undefined'
      image_public_id: imagePublicId ?? null,
      display_order: dto.display_order ?? 0,
      status: dto.status ?? 'active',
    });
  }
}