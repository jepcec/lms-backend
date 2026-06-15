export class EnrollmentCreatedEvent {
  static readonly EVENT = 'enrollment.created';

  constructor(
    public readonly userId: string,
    public readonly courseId: string,
    public readonly courseTitle: string,
    public readonly courseSlug: string,
  ) {}
}
