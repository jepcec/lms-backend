import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { VerifyOrderStatusUseCase } from './verify-order-status.use-case';

jest.mock('../../../../core/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('VerifyOrderStatusUseCase', () => {
  let useCase: VerifyOrderStatusUseCase;
  let prisma: {
    order: { findUnique: jest.Mock };
  };

  beforeEach(() => {
    prisma = { order: { findUnique: jest.fn() } };
    useCase = new VerifyOrderStatusUseCase(prisma as never);
  });

  it.each([
    ['paid', true],
    ['pending', false],
    ['failed', false],
    ['refunded', false],
  ])('reports %s payment as success=%s', async (paymentStatus, success) => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-id',
      user_id: 'student-id',
      payment_status: paymentStatus,
    });

    await expect(useCase.execute('order-id', 'student-id')).resolves.toEqual({
      success,
      orderId: 'order-id',
      payment_status: paymentStatus,
    });

    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { id: 'order-id' },
      select: { id: true, user_id: true, payment_status: true },
    });
  });

  it('rejects an order that does not belong to the student', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-id',
      user_id: 'another-student',
      payment_status: 'paid',
    });

    await expect(useCase.execute('order-id', 'student-id')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('returns not found for an unknown order', async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    await expect(useCase.execute('missing-id', 'student-id')).rejects.toThrow(
      NotFoundException,
    );
  });
});
