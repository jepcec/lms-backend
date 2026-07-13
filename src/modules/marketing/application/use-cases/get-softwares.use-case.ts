import { Inject, Injectable } from '@nestjs/common';
import {
  I_SOFTWARE_REPOSITORY,
  type ISoftwareRepository,
} from '../../domain/softwares.repository';

@Injectable()
export class GetSoftwaresUseCase {
  constructor(
    @Inject(I_SOFTWARE_REPOSITORY)
    private readonly softwareRepository: ISoftwareRepository,
  ) {}

  async execute(onlyVigentes?: boolean) {
    return this.softwareRepository.findAll(onlyVigentes);
  }
}
