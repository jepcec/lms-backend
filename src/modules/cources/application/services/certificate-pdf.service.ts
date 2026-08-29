import * as fs from 'fs/promises';
import * as path from 'path';
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../../../core/database/prisma.service';

interface NamePosition {
  x: number;
  y: number;
}

interface FontSizes {
  student_name?: number;
  [key: string]: number | undefined;
}

export interface CertificatePdfResult {
  buffer: Buffer;
  filename: string;
}

@Injectable()
export class CertificatePdfService {
  private readonly logger = new Logger(CertificatePdfService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async generateBuffer(
    certificateId: string,
    userId?: string,
  ): Promise<CertificatePdfResult> {
    const cert = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        template: true,
        enrollment: {
          include: {
            student: { select: { first_name: true, last_name: true } },
            course: { select: { title: true } },
          },
        },
      },
    });

    if (!cert) throw new NotFoundException('Certificado no encontrado');

    if (userId && cert.enrollment.user_id !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para descargar este certificado',
      );
    }

    const studentName = `${cert.enrollment.student.first_name} ${cert.enrollment.student.last_name}`;

    // 1. Descargar imagen de fondo
    const bgBuffer = await this.fetchImageBuffer(
      cert.template.background_image_url,
    );

    // 2. Crear documento PDF en A4 apaisado (2 páginas: cara + contraportada)
    // El editor de plantillas usa espacio virtual 3508×2480 (A4 a 300 DPI).
    // El PDF usa puntos tipográficos: A4 apaisado = 841.9×595.3 pt.
    const CERT_W = 3508;
    const CERT_H = 2480;
    const PAGE_W = 841.9;
    const PAGE_H = 595.3;

    const pdfDoc = await PDFDocument.create();

    // ── Página 1: Cara (fondo + nombre del estudiante) ──
    const frontPage = pdfDoc.addPage([PAGE_W, PAGE_H]);

    const isJpeg = this.isJpeg(cert.template.background_image_url, bgBuffer);
    const bgImage = isJpeg
      ? await pdfDoc.embedJpg(bgBuffer)
      : await pdfDoc.embedPng(bgBuffer);

    frontPage.drawImage(bgImage, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });

    const namePos = cert.template
      .student_name_position as unknown as NamePosition;
    const fontSizes = cert.template.font_sizes as FontSizes;
    const rawFontSize = fontSizes?.student_name ?? 200;

    const scaleX = PAGE_W / CERT_W;
    const scaleY = PAGE_H / CERT_H;
    const fontSize = rawFontSize * scaleX;

    const font = await pdfDoc.embedFont(
      this.mapToStandardFont(cert.template.font_family),
    );
    const nameWidth = font.widthOfTextAtSize(studentName, fontSize);
    const nameHeight = font.heightAtSize(fontSize);

    const pdfNameX = namePos.x * scaleX - nameWidth / 2;
    const pdfNameY = PAGE_H - namePos.y * scaleY - nameHeight / 2;

    this.logger.log(
      `Generando PDF "${studentName}" → fontSize=${fontSize.toFixed(1)}pt`,
    );

    frontPage.drawText(studentName, {
      x: pdfNameX,
      y: pdfNameY,
      size: fontSize,
      font,
      color: rgb(0.08, 0.08, 0.08),
    });

    // ── Página 2: Contraportada (fondo + QR) — solo para Certificados.
    // Las Constancias no llevan QR ni código de verificación, así que se
    // entregan como un documento de una sola página (la cara).
    if (cert.type === 'Certificado') {
      const backPage = pdfDoc.addPage([PAGE_W, PAGE_H]);

      const backImageUrl = (cert.template as { back_image_url?: string })
        .back_image_url;
      if (backImageUrl) {
        const backBuffer = await this.fetchImageBuffer(backImageUrl);
        const isBackJpeg = this.isJpeg(backImageUrl, backBuffer);
        const backImage = isBackJpeg
          ? await pdfDoc.embedJpg(backBuffer)
          : await pdfDoc.embedPng(backBuffer);
        backPage.drawImage(backImage, {
          x: 0,
          y: 0,
          width: PAGE_W,
          height: PAGE_H,
        });
      }

      const frontendUrl =
        this.config.get<string>('URL_FRONTEND') ??
        'https://especializacionesglobal.net';
      const verifyUrl = `${frontendUrl}/verificar/${cert.verification_code}`;

      const qrPos = cert.template.qr_position as unknown as NamePosition;
      const rawQrSize = (cert.template as { qr_size?: number }).qr_size ?? 300;
      const qrPt = rawQrSize * scaleX;

      const qrPngBuffer = await QRCode.toBuffer(verifyUrl, {
        type: 'png',
        width: Math.round(qrPt * 4),
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      });
      const qrImage = await pdfDoc.embedPng(qrPngBuffer);

      const pdfQrX = qrPos.x * scaleX - qrPt / 2;
      const pdfQrY = PAGE_H - qrPos.y * scaleY - qrPt / 2;

      backPage.drawImage(qrImage, {
        x: pdfQrX,
        y: pdfQrY,
        width: qrPt,
        height: qrPt,
      });
    }

    // 6. Serializar y retornar buffer (sin guardar en disco)
    const pdfBytes = await pdfDoc.save();
    const filename = `certificado-${studentName.replace(/\s+/g, '-')}.pdf`;

    return { buffer: Buffer.from(pdfBytes), filename };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async fetchImageBuffer(url: string): Promise<Buffer> {
    if (url.startsWith('/')) {
      const filePath = path.join(process.cwd(), url);
      return fs.readFile(filePath);
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`No se pudo descargar la imagen de plantilla: ${url}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  private isJpeg(url: string, buffer: Buffer): boolean {
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return true;
    return /\.(jpg|jpeg)(\?|$)/i.test(url);
  }

  private mapToStandardFont(
    fontFamily: string,
  ): (typeof StandardFonts)[keyof typeof StandardFonts] {
    const lower = (fontFamily ?? '').toLowerCase();
    if (lower.includes('bold')) return StandardFonts.HelveticaBold;
    if (
      lower.includes('times') ||
      lower.includes('georgia') ||
      lower.includes('serif')
    )
      return StandardFonts.TimesRoman;
    if (lower.includes('courier') || lower.includes('mono'))
      return StandardFonts.Courier;
    return StandardFonts.Helvetica;
  }
}
