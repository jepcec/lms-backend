import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TurnstileService } from '../services/turnstile.service';

// Guard opt-in: se aplica con @UseGuards(TurnstileGuard) solo en las rutas que
// deben pasar por verificación anti-bot (register, login, forgot-password,
// reset-password). No es global, no afecta al resto de rutas del controller.
@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(private readonly turnstileService: TurnstileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.body?.turnstileToken;

    if (!token || typeof token !== 'string') {
      throw new BadRequestException(
        'Falta el token de verificación de seguridad',
      );
    }

    const isValid = await this.turnstileService.verify(token, request.ip);
    if (!isValid) {
      throw new BadRequestException(
        'Verificación de seguridad fallida, intenta nuevamente',
      );
    }

    return true;
  }
}
