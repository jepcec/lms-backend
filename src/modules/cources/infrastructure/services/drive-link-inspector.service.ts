import { Injectable, Logger } from '@nestjs/common';
import { drivePreviewUrl, parseGoogleDriveLink } from './google-drive-link';

export type DriveLinkKind = 'file' | 'folder' | 'document';
export type DriveLinkAccess = 'public' | 'private' | 'not_found' | 'unknown';

export interface DriveLinkInspection {
  provider: 'google' | 'other';
  kind: DriveLinkKind | null;
  access: DriveLinkAccess;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Indica si un enlace de Google Drive/Docs se puede ver sin iniciar sesión —
 * condición para que su vista previa incrustada funcione. Nunca hace fetch a
 * la URL recibida: extrae el ID con una regex estricta y arma la URL de
 * Google por su cuenta, así el endpoint no sirve para pedir otros hosts.
 */
@Injectable()
export class DriveLinkInspectorService {
  private readonly logger = new Logger(DriveLinkInspectorService.name);
  private readonly cache = new Map<string, { result: DriveLinkInspection; expiresAt: number }>();

  async inspect(rawUrl: string): Promise<DriveLinkInspection> {
    const target = this.toCanonicalTarget(rawUrl);
    if (!target) return { provider: 'other', kind: null, access: 'unknown' };

    const cached = this.cache.get(target.url);
    if (cached && cached.expiresAt > Date.now()) return cached.result;

    const result: DriveLinkInspection = {
      provider: 'google',
      kind: target.kind,
      access: await this.checkAccess(target.url),
    };

    // 'unknown' es un fallo transitorio (timeout, red): no se cachea.
    if (result.access !== 'unknown') this.remember(target.url, result);
    return result;
  }

  private toCanonicalTarget(rawUrl: string): { url: string; kind: DriveLinkKind } | null {
    const link = parseGoogleDriveLink(rawUrl);
    if (!link) return null;

    switch (link.kind) {
      case 'folder':
        return { url: `https://drive.google.com/embeddedfolderview?id=${link.id}`, kind: 'folder' };
      case 'file':
        return { url: drivePreviewUrl(link.id), kind: 'file' };
      case 'document':
        return {
          url: `https://docs.google.com/${link.docType}/d/${link.id}/preview`,
          kind: 'document',
        };
    }
  }

  private async checkAccess(url: string): Promise<DriveLinkAccess> {
    try {
      const response = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.status === 200) return 'public';
      if (response.status === 401 || response.status === 403) return 'private';
      if (response.status === 404) return 'not_found';
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location') ?? '';
        if (location.includes('accounts.google.com')) return 'private';
      }
      return 'unknown';
    } catch (error) {
      this.logger.warn(`No se pudo verificar el enlace de Drive: ${(error as Error).message}`);
      return 'unknown';
    }
  }

  private remember(key: string, result: DriveLinkInspection) {
    if (this.cache.size >= CACHE_MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  }
}
