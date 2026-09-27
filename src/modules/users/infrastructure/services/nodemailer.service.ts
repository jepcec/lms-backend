import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IEmailService } from '../../domain/services/email.service';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import {
  getVerificationTemplate,
  getRecoveryTemplate,
  getAccountCreatedTemplate,
} from './email-templates';

@Injectable()
export class NodemailerEmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const port = Number(this.configService.get('SMTP_PORT'));
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('SMTP_PORT debe ser un puerto válido');
    }
    const secure = port === 465;
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port,
      secure,
      requireTLS: !secure,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: true,
      },
    });
  }

  async sendEmailVerification(
    email: string,
    token: string,
    firstName?: string,
  ): Promise<void> {
    const baseUrl = this.configService.get<string>('URL_FRONTEND');
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;
    await this.send({
      to: email,
      subject: 'Verifica tu cuenta',
      html: getVerificationTemplate(this.logoUrl, verificationUrl, firstName),
    });
  }

  async sendPasswordRecovery(
    email: string,
    token: string,
    firstName?: string,
  ): Promise<void> {
    const baseUrl = this.configService.get<string>('URL_FRONTEND');
    const recoveryUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    await this.send({
      to: email,
      subject: 'Recuperación de contraseña',
      html: getRecoveryTemplate(this.logoUrl, recoveryUrl, firstName),
    });
  }

  async sendAccountCreated(email: string, firstName: string): Promise<void> {
    const baseUrl = this.configService.get<string>('URL_FRONTEND');
    const loginUrl = `${baseUrl}/auth/login`;

    await this.send({
      to: email,
      subject: 'Tu cuenta ha sido creada',
      html: getAccountCreatedTemplate(this.logoUrl, firstName, loginUrl),
    });
  }

  private get logoUrl(): string {
    const baseUrl = this.configService.get<string>('URL_FRONTEND');
    return `${baseUrl}/Logo_escuela_global.png`;
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
}
