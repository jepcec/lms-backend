export class CourseCompletedEvent {
  static readonly EVENT = 'course.completed';

  constructor(
    public readonly userId: string,
    public readonly courseId: string,
    public readonly courseTitle: string,
    public readonly courseSlug: string,
  ) {}
}
