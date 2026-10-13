export class ReminderScheduledEvent {
  static readonly EVENT = 'reminder.scheduled';

  constructor(
    public readonly userId: string,
    public readonly courseId: string,
    public readonly courseTitle: string,
    public readonly courseSlug: string,
    public readonly message: string,
  ) {}
}
