import { Inject, Injectable } from '@nestjs/common';
import {
  I_SLIDER_REPOSITORY,
  type ISliderRepository,
} from '../../domain/sliders.repository';
import { CreateSliderDto } from '../dtos/create-slider.dto';

@Injectable()
export class CreateSliderUseCase {
  constructor(
    @Inject(I_SLIDER_REPOSITORY)
    private readonly sliderRepository: ISliderRepository,
  ) {}

  async execute(dto: CreateSliderDto) {
    return this.sliderRepository.create(dto);
  }
}
