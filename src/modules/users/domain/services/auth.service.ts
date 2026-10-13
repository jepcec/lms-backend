// src/modules/users/domain/services/auth-internal.service.ts

export interface IPasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

import type { SessionPrincipal } from '../../../auth/session-token';

export interface IAuthTokenService {
  // tokens en login
  generate(payload: SessionPrincipal): string;
  generateRefresh(payload: SessionPrincipal): string;
  verifyRefresh(token: string): any;

  // tokens de verificaion y password
  generateActionToken(payload: {
    userId: string;
    action: 'verify' | 'recover';
  }): string;
  verifyActionToken(token: string): any;
}

export const I_PASSWORD_SERVICE = Symbol('IPasswordService');
export const I_AUTH_TOKEN_SERVICE = Symbol('IAuthTokenService');
