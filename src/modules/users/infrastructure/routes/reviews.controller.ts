import { Controller, Post, Body } from '@nestjs/common';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import {
  SubmitReviewUseCase,
  SubmitReviewDto,
} from '../../application/use-cases/submit-review.use-case';

@Controller('reviews')
@Roles('estudiante')
export class ReviewsController {
  constructor(private readonly submitReviewUseCase: SubmitReviewUseCase) {}

  @Post()
  async submitReview(
    @CurrentUser('userId') userId: string,
    @Body() body: SubmitReviewDto,
  ) {
    return this.submitReviewUseCase.execute(userId, body);
  }
}
