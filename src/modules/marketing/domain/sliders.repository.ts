import { SliderEntity } from './slider.entity';

export interface ISliderRepository {
  findAll(): Promise<SliderEntity[]>;
  findById(id: string): Promise<SliderEntity | null>;
  create(slider: Partial<SliderEntity> & { course_ids?: string[] }): Promise<SliderEntity>;
  update(id: string, slider: Partial<SliderEntity> & { course_ids?: string[] }): Promise<SliderEntity>;
  delete(id: string): Promise<void>;
}

export const I_SLIDER_REPOSITORY = Symbol('ISliderRepository');
