import * as fs from 'fs/promises';
import * as path from 'path';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../../../core/database/prisma.service';
import { I_FILE_STORAGE_SERVICE } from '../../../storage/domain/file-storage.interface';
import type { IFileStorageService } from '../../../storage/domain/file-storage.interface';

interface NamePosition {
  x: number;
  y: number;
}

interface FontSizes {
  student_name?: number;
  [key: string]: number | undefined;
}

@Injectable()
export class CertificatePdfService {
  private readonly logger = new Logger(CertificatePdfService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly storage: IFileStorageService,
    private readonly config: ConfigService,
  ) {}

  // ── Genera el PDF de un certificado y actualiza pdf_url en BD ──────────────
  async generateForCertificate(certificateId: string): Promise<string> {
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

    if (!cert) throw new Error(`Certificado ${certificateId} no encontrado`);

    const studentName = `${cert.enrollment.student.first_name} ${cert.enrollment.student.last_name}`;
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ??
      'https://especializacionesglobal.net';
    const verifyUrl = `${frontendUrl}/verificar/${cert.verification_code}`;

    // 1. Descargar imagen de fondo
    const bgBuffer = await this.fetchImageBuffer(
      cert.template.background_image_url,
    );

    // 2. Crear documento PDF en A4 apaisado
    // El editor de plantillas usa espacio virtual 3508×2480 (A4 a 300 DPI).
    // El PDF usa puntos tipográficos: A4 apaisado = 841.9×595.3 pt.
    const CERT_W = 3508;
    const CERT_H = 2480;
    const PAGE_W = 841.9;
    const PAGE_H = 595.3;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

    // Embedder imagen de fondo
    const isJpeg = this.isJpeg(cert.template.background_image_url, bgBuffer);
    const bgImage = isJpeg
      ? await pdfDoc.embedJpg(bgBuffer)
      : await pdfDoc.embedPng(bgBuffer);

    // Fondo a página completa
    page.drawImage(bgImage, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });

    // 3. Posiciones y tamaños desde la plantilla
    // Todas las unidades (coords y font_size) están en espacio virtual 3508×2480.
    // Se escalan a PDF points igual que las coordenadas.
    const namePos = cert.template
      .student_name_position as unknown as NamePosition;
    const qrPos = cert.template.qr_position as unknown as NamePosition;
    const fontSizes = cert.template.font_sizes as FontSizes;
    const rawFontSize = fontSizes?.student_name ?? 200; // unidades virtuales

    // Escala de espacio virtual → puntos PDF
    const scaleX = PAGE_W / CERT_W;
    const scaleY = PAGE_H / CERT_H;

    // font_size almacenado en unidades del espacio virtual → convertir a pt PDF
    const fontSize = rawFontSize * scaleX;

    // 4. Nombre del estudiante
    const font = await pdfDoc.embedFont(
      this.mapToStandardFont(cert.template.font_family),
    );
    const nameWidth = font.widthOfTextAtSize(studentName, fontSize);
    const nameHeight = font.heightAtSize(fontSize);

    // Escalar posición y flipear Y (pdf-lib: origen bottom-left)
    const pdfNameX = namePos.x * scaleX - nameWidth / 2;
    const pdfNameY = PAGE_H - namePos.y * scaleY - nameHeight / 2;

    this.logger.log(
      `Texto "${studentName}" → fontSize=${fontSize.toFixed(1)}pt, x=${pdfNameX.toFixed(1)}, y=${pdfNameY.toFixed(1)}`,
    );

    page.drawText(studentName, {
      x: pdfNameX,
      y: pdfNameY,
      size: fontSize,
      font,
      color: rgb(0.08, 0.08, 0.08),
    });

    // 5. QR code — tamaño en unidades virtuales, igual que las coordenadas
    const rawQrSize = (cert.template as { qr_size?: number }).qr_size ?? 300;
    const qrPt = rawQrSize * scaleX; // convertir a puntos PDF

    const qrPngBuffer = await QRCode.toBuffer(verifyUrl, {
      type: 'png',
      width: Math.round(qrPt * 4), // alta resolución
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
    const qrImage = await pdfDoc.embedPng(qrPngBuffer);

    const pdfQrX = qrPos.x * scaleX - qrPt / 2;
    const pdfQrY = PAGE_H - qrPos.y * scaleY - qrPt / 2;

    page.drawImage(qrImage, {
      x: pdfQrX,
      y: pdfQrY,
      width: qrPt,
      height: qrPt,
    });

    // 6. Serializar y subir
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const uploaded = await this.storage.upload({
      buffer: pdfBuffer,
      originalName: `cert-${cert.verification_code}.pdf`,
      mimetype: 'application/pdf',
      folder: 'certificates',
    });

    // 7. Guardar URL en BD
    await this.prisma.certificate.update({
      where: { id: certificateId },
      data: { pdf_url: uploaded.secureUrl },
    });

    this.logger.log(`PDF generado: ${uploaded.secureUrl}`);
    return uploaded.secureUrl;
  }

  // ── Genera el PDF de un certificado por enrollment_id ─────────────────────
  async generateForEnrollment(enrollmentId: string): Promise<string | null> {
    const cert = await this.prisma.certificate.findUnique({
      where: { enrollment_id: enrollmentId },
      select: { id: true },
    });
    if (!cert) return null;
    return this.generateForCertificate(cert.id);
  }

  // ── Genera (o regenera) PDFs para todos los certificados de un curso ─────────
  async generateAllForCourse(courseId: string): Promise<{
    generated: number;
    failed: number;
    errors: string[];
  }> {
    const pending = await this.prisma.certificate.findMany({
      where: { enrollment: { course_id: courseId } },
      select: { id: true },
    });

    let generated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const cert of pending) {
      try {
        await this.generateForCertificate(cert.id);
        generated++;
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Certificado ${cert.id}: ${msg}`);
        this.logger.error(`Error generando PDF ${cert.id}: ${msg}`);
      }
    }

    return { generated, failed, errors };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async fetchImageBuffer(url: string): Promise<Buffer> {
    // Rutas relativas (storage local): leer directamente del disco
    if (url.startsWith('/')) {
      const filePath = path.join(process.cwd(), url);
      return fs.readFile(filePath);
    }
    // URLs absolutas (Cloudinary u otro CDN): descargar via HTTP
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`No se pudo descargar la imagen de plantilla: ${url}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  private isJpeg(url: string, buffer: Buffer): boolean {
    // Detectar por magic bytes (más fiable que la extensión)
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
