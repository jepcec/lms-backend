export type GoogleDocType = 'document' | 'spreadsheets' | 'presentation';

export type GoogleDriveLink =
  | { kind: 'file'; id: string }
  | { kind: 'folder'; id: string }
  | { kind: 'document'; id: string; docType: GoogleDocType };

const SAFE_ID = /^[\w-]+$/;

/**
 * Reconoce enlaces de Google Drive/Docs y extrae su ID. Solo acepta https y
 * los hosts exactos de Google, así que el resultado es seguro para construir
 * URLs de Google a partir de él (nunca se reutiliza la URL original).
 */
export function parseGoogleDriveLink(rawUrl: string): GoogleDriveLink | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;

  const host = url.hostname.replace(/^www\./, '');
  const path = url.pathname;

  if (host === 'drive.google.com') {
    const folderId = path.match(/\/drive\/(?:u\/\d+\/)?folders\/([\w-]+)/)?.[1];
    if (folderId) return { kind: 'folder', id: folderId };

    const fileId =
      path.match(/\/file\/(?:u\/\d+\/)?d\/([\w-]+)/)?.[1] ?? url.searchParams.get('id');
    if (fileId && SAFE_ID.test(fileId)) return { kind: 'file', id: fileId };
  }

  if (host === 'docs.google.com') {
    const doc = path.match(/^\/(document|spreadsheets|presentation)\/(?:u\/\d+\/)?d\/([\w-]+)/);
    if (doc) return { kind: 'document', id: doc[2], docType: doc[1] as GoogleDocType };
  }

  return null;
}

export function drivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}
