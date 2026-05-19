import { Inject, Injectable } from '@nestjs/common';
import { I_SLIDER_REPOSITORY,type ISliderRepository } from '../../domain/sliders.repository';

@Injectable()
export class DeleteSliderUseCase {
  constructor(
    @Inject(I_SLIDER_REPOSITORY)
    private readonly sliderRepository: ISliderRepository,
  ) {}

  async execute(id: string): Promise<void> {
    await this.sliderRepository.delete(id);
  }
}
