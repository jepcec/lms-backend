export interface IEmailService{
	sendEmailVerification(email: string, token: string): Promise<void>
	sendPasswordRecovery(email: string, token: string): Promise<void>

}
export const I_EMAIL_SERVICE = Symbol('IEmailService')
