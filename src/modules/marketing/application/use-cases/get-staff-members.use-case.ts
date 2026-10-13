import { Inject, Injectable } from '@nestjs/common';
import {
  I_STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../domain/staff-members.repository';

@Injectable()
export class GetStaffMembersUseCase {
  constructor(
    @Inject(I_STAFF_MEMBER_REPOSITORY)
    private readonly staffRepository: IStaffMemberRepository,
  ) {}

  async execute(onlyVigentes?: boolean) {
    return this.staffRepository.findAll(onlyVigentes);
  }
}
