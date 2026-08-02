export interface IEmailService {
  sendEmailVerification(
    email: string,
    token: string,
    firstName?: string,
  ): Promise<void>;
  sendPasswordRecovery(
    email: string,
    token: string,
    firstName?: string,
  ): Promise<void>;
  sendAccountCreated(email: string, firstName: string): Promise<void>;
}
export const I_EMAIL_SERVICE = Symbol('IEmailService');
