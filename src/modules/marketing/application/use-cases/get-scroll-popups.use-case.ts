import { Inject, Injectable } from '@nestjs/common';
import {
  I_SCROLL_POPUP_REPOSITORY,
  type IScrollPopupRepository,
} from '../../domain/scroll-popups.repository';

@Injectable()
export class GetScrollPopupsUseCase {
  constructor(
    @Inject(I_SCROLL_POPUP_REPOSITORY)
    private readonly popupRepository: IScrollPopupRepository,
  ) {}

  async execute(onlyVigentes?: boolean) {
    return this.popupRepository.findAll(onlyVigentes);
  }
}
