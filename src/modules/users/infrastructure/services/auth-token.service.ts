// src/modules/users/infrastructure/services/jwt-token.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IAuthTokenService } from '../../domain/services/auth.service';

@Injectable()
export class TokenService implements IAuthTokenService {
	constructor(private readonly jwtService: JwtService) {}

	generate(payload: any): string {
		return this.jwtService.sign(payload);
	}
}
