import { Inject, Injectable } from '@nestjs/common';
import {
  I_ALLIANCE_REPOSITORY,
  type IAllianceRepository,
} from '../../domain/alliances.repository';

@Injectable()
export class GetAlliancesUseCase {
  constructor(
    @Inject(I_ALLIANCE_REPOSITORY)
    private readonly allianceRepository: IAllianceRepository,
  ) {}

  async execute(onlyVigentes?: boolean) {
    return this.allianceRepository.findAll(onlyVigentes);
  }
}
