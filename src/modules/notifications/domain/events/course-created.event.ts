export class CourseCreatedEvent {
  static readonly EVENT = 'course.created';

  constructor(
    public readonly userId: string,
    public readonly courseId: string,
    public readonly courseTitle: string,
    public readonly courseSlug: string,
    public readonly instructorName: string,
  ) {}
}
