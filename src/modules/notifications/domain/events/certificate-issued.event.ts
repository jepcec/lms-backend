export class CertificateIssuedEvent {
  static readonly EVENT = 'certificate.issued';

  constructor(
    public readonly userId: string,
    public readonly courseId: string,
    public readonly courseTitle: string,
    public readonly certificateId: string,
    public readonly certificateCode: string,
  ) {}
}
