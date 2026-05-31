import { Inject, Injectable } from '@nestjs/common';
import {
  I_SLIDER_REPOSITORY,
  type ISliderRepository,
} from '../../domain/sliders.repository';

@Injectable()
export class GetSlidersUseCase {
  constructor(
    @Inject(I_SLIDER_REPOSITORY)
    private readonly sliderRepository: ISliderRepository,
  ) {}

  async execute() {
    return this.sliderRepository.findAll();
  }
}
