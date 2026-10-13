import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  I_STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../domain/staff-members.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { replaceStoredImage } from '../../../storage/domain/replace-stored-image';
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

    const imageUrl = dto.image_url ?? member.image_url;
    const imagePublicId = dto.image_public_id ?? member.image_public_id;
    const previousPublicId = member.image_public_id;

    if (dto.image) {
      return replaceStoredImage(
        this.fileStorageService,
        {
          buffer: dto.image.buffer,
          originalName: dto.image.originalname,
          mimetype: dto.image.mimetype,
          folder: 'staff',
        },
        previousPublicId,
        (imageUrl, imagePublicId) =>
          this.staffRepository.update(id, {
            ...(dto.full_name !== undefined && { full_name: dto.full_name }),
            ...(dto.title !== undefined && { title: dto.title }),
            ...(dto.description !== undefined && {
              description: dto.description,
            }),
            ...(dto.status && { status: dto.status }),
            ...(imageUrl && { image_url: imageUrl }),
            ...(imagePublicId && { image_public_id: imagePublicId }),
          }),
        { format: 'webp' },
      );
    }

    return this.staffRepository.update(id, {
      ...(dto.full_name !== undefined && { full_name: dto.full_name }),
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.status && { status: dto.status }),
      ...(imageUrl && { image_url: imageUrl }),
      ...(imagePublicId && { image_public_id: imagePublicId }),
    });
  }
}
