import { CanActivate, Injectable, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { Request, Response } from "express";
import { IS_PUBLIC_KEY } from "../../../auth/decorators/public.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private configService: ConfigService,
		private reflector: Reflector,
	) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (isPublic) return true;

		const request = context.switchToHttp().getRequest<Request>()
		const response = context.switchToHttp().getResponse<Response>()

		const accessToken = request.cookies['access_token']
		const refreshToken = request.cookies['refresh_token']

		// 1. Intentar con access_token
		if (accessToken) {
			try {
				const payload = await this.jwtService.verifyAsync(accessToken, {
					secret: this.configService.get<string>('JWT_SECRET')
				})
				console.log("1:",payload)
				request['user'] = payload
				return true
			} catch {
				// access_token expiró, intentar refresh
			}
		}

		// 2. Intentar con refresh_token
		if (refreshToken) {
			try {
				const payload = await this.jwtService.verifyAsync(refreshToken, {
					secret: this.configService.get<string>('JWT_REFRESH_SECRET')
				})
				console.log("2: ",payload)

				const newAccessToken = this.jwtService.sign(
					{ userId: payload.userId, role: payload.role },
					{
						secret: this.configService.get<string>('JWT_SECRET'),
						expiresIn: '15m'
					}
				)

				response.cookie('access_token', newAccessToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'lax',
					maxAge: 15 * 60 * 1000,
				})

				request['user'] = payload
				return true
			} catch {
				throw new UnauthorizedException("Sesion expirada o invalida")
			}
		}

		throw new UnauthorizedException("No tienes session activa")
	}
}
