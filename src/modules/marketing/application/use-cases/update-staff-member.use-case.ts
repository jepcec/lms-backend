import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  I_STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../domain/staff-members.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { UpdateStaffMemberDto } from '../dtos/update-staff-member.dto';

@Injectable()
export class UpdateStaffMemberUseCase {
  constructor(
    @Inject(I_STAFF_MEMBER_REPOSITORY)
    private readonly staffRepository: IStaffMemberRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(id: string, dto: UpdateStaffMemberDto) {
    const member = await this.staffRepository.findById(id);
    if (!member) throw new NotFoundException('Docente no encontrado');

    let imageUrl = dto.image_url ?? member.image_url;
    let imagePublicId = dto.image_public_id ?? member.image_public_id;
    const previousPublicId = member.image_public_id;

    if (dto.image) {
      if (previousPublicId) {
        await this.fileStorageService.delete(previousPublicId);
      }
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

    return this.staffRepository.update(id, {
      image_url: imageUrl,
      image_public_id: imagePublicId,
      display_order: dto.display_order,
      status: dto.status,
    });
  }
}
