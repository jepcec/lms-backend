import { Inject, Injectable } from '@nestjs/common';
import {
  I_STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../domain/staff-members.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';

@Injectable()
export class DeleteStaffMemberUseCase {
  constructor(
    @Inject(I_STAFF_MEMBER_REPOSITORY)
    private readonly staffRepository: IStaffMemberRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(id: string): Promise<void> {
    const member = await this.staffRepository.findById(id);
    if (member?.image_public_id) {
      await this.fileStorageService.delete(member.image_public_id);
    }
    await this.staffRepository.delete(id);
  }
}
