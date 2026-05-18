import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { I_SLIDER_REPOSITORY, type ISliderRepository } from '../../domain/sliders.repository';
import { UpdateSliderDto } from '../dtos/update-slider.dto';

@Injectable()
export class UpdateSliderUseCase {
  constructor(
    @Inject(I_SLIDER_REPOSITORY)
    private readonly sliderRepository: ISliderRepository,
  ) {}

  async execute(id: string, dto: UpdateSliderDto) {
    const slider = await this.sliderRepository.findById(id);
    if (!slider) throw new NotFoundException('Slider not found');

    return this.sliderRepository.update(id, dto as any);
  }
}
