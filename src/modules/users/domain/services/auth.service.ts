// src/modules/users/domain/services/auth-internal.service.ts

export interface IPasswordService {
	hash(password: string): Promise<string>;
	compare(password: string, hash: string): Promise<boolean>;
}

export interface IAuthTokenService {
	generate(payload: { userId: string; role: string }): string;

	generateRefresh(payload: {userId: string}): string;
	verifyRefresh(token: string): any;
}

export const I_PASSWORD_SERVICE = Symbol('IPasswordService');
export const I_AUTH_TOKEN_SERVICE = Symbol('IAuthTokenService');
