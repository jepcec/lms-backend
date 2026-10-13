import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import {
  SubmitReviewUseCase,
  SubmitReviewDto,
} from '../../application/use-cases/submit-review.use-case';
import { ListReviewsUseCase } from '../../application/use-cases/list-reviews.use-case';
import type { ListReviewsParams } from '../../application/use-cases/list-reviews.use-case';
import {
  UpdateReviewStatusUseCase,
  UpdateReviewStatusDto,
} from '../../application/use-cases/update-review-status.use-case';

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly submitReviewUseCase: SubmitReviewUseCase,
    private readonly listReviewsUseCase: ListReviewsUseCase,
    private readonly updateReviewStatusUseCase: UpdateReviewStatusUseCase,
  ) {}

  @Post()
  @Roles('estudiante')
  async submitReview(
    @CurrentUser('userId') userId: string,
    @Body() body: SubmitReviewDto,
  ) {
    return this.submitReviewUseCase.execute(userId, body);
  }

  @Get()
  @Roles('admin', 'soporte')
  async list(@Query() params: ListReviewsParams) {
    return this.listReviewsUseCase.execute(params);
  }

  @Patch(':id')
  @Roles('admin', 'soporte')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateReviewStatusDto,
  ) {
    return this.updateReviewStatusUseCase.execute(id, body);
  }
}
