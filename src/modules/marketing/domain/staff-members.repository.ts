import { StaffMemberEntity } from './staff-member.entity';

export interface IStaffMemberRepository {
  findAll(onlyVigentes?: boolean): Promise<StaffMemberEntity[]>;
  findById(id: string): Promise<StaffMemberEntity | null>;
  create(member: Partial<StaffMemberEntity>): Promise<StaffMemberEntity>;
  update(
    id: string,
    member: Partial<StaffMemberEntity>,
  ): Promise<StaffMemberEntity>;
  delete(id: string): Promise<void>;
}

export const I_STAFF_MEMBER_REPOSITORY = Symbol('IStaffMemberRepository');
