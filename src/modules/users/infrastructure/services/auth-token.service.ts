// src/modules/users/infrastructure/services/jwt-token.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IAuthTokenService } from '../../domain/services/auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService implements IAuthTokenService {
	constructor(private readonly jwtService: JwtService,
		   private readonly configService: ConfigService) {}

	generate(payload: any): string {
		return this.jwtService.sign(payload, {expiresIn: '15m'});
	}

	generateRefresh(payload: { userId: string; }): string {
		const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')	

		return this.jwtService.sign(payload,{secret: refreshSecret, expiresIn:'7d'})
	}
	verifyRefresh(token: string) {
		const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')	
		try {
			return this.jwtService.verify(token, {secret: refreshSecret})	
		} catch (error) {
			return null	
		}
	}
}
