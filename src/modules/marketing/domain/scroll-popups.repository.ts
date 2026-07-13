import { ScrollPopupEntity } from './scroll-popup.entity';

export interface IScrollPopupRepository {
  findAll(onlyVigentes?: boolean): Promise<ScrollPopupEntity[]>;
  findById(id: string): Promise<ScrollPopupEntity | null>;
  create(popup: Partial<ScrollPopupEntity>): Promise<ScrollPopupEntity>;
  update(
    id: string,
    popup: Partial<ScrollPopupEntity>,
  ): Promise<ScrollPopupEntity>;
  delete(id: string): Promise<void>;
}

export const I_SCROLL_POPUP_REPOSITORY = Symbol('IScrollPopupRepository');
