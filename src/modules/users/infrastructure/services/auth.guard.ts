// SE USA COMO GUARDIAN PARA LAS OPERACIONES: tiene que verifiacion si en la consulta viene con el token integrado
import { CanActivate, Injectable, ExecutionContext, UnauthorizedException} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private configService: ConfigService
	){}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>()

		const token = request.cookies['access_token']
		if (!token){
			throw  new UnauthorizedException("No tienes session activa")
		}

		try {
			const payload = await this.jwtService.verifyAsync(token, {
				secret: this.configService.get<string>('JWT_SECRET')
			})	

			request['user'] = payload
		} catch (error) {
			throw new UnauthorizedException("Sesion expirada o invalida")	
		}
		return true

	}
}
