import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IEmailService } from '../../domain/services/email.service';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NodemailerEmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    const baseUrl = this.configService.get<string>('URL_FRONTEND');
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;
    const res = await this.send({
      to: email,
      subject: 'verifica tu cuenta',
      html: this.getVerificationTemplate(verificationUrl),
    });
    return res;
  }

  async sendPasswordRecovery(email: string, token: string): Promise<void> {
    const baseUrl = this.configService.get<string>('URL_FRONTEND');
    const recoveryUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    await this.send({
      to: email,
      subject: 'Recuperacion de contrase;a',
      html: this.getRecoveryTemplate(recoveryUrl),
    });
  }

  private async send(options: { to: string; subject: string; html: string }) {
    try {
      await this.transporter.sendMail({
        from: `"Soporte Técnico" <${this.configService.get('SMTP_USER')}>`,
        ...options,
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al enviar el correo');
    }
  }
  private getVerificationTemplate(url: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #333;">¡Bienvenido!</h2>
        <p>Gracias por registrarte. Para completar tu perfil, por favor verifica tu correo haciendo clic en el siguiente botón:</p>
        <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verificar Correo</a>
        <p style="margin-top: 20px; font-size: 0.8em; color: #777;">Este enlace expirará en 24 horas.</p>
      </div>
    `;
  }

  private getRecoveryTemplate(url: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #333;">Recuperación de Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para continuar:</p>
        <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
        <p style="margin-top: 20px; font-size: 0.8em; color: #777;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
      </div>
    `;
  }
}
