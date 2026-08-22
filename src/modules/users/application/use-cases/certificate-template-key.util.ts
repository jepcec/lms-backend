export type CertificateTemplateOwnerType =
  | 'course_certificado'
  | 'course_constancia'
  | 'module';

const OWNER_PATH: Record<CertificateTemplateOwnerType, string> = {
  course_certificado: 'course',
  course_constancia: 'course',
  module: 'module',
};

const KIND: Record<CertificateTemplateOwnerType, string> = {
  course_certificado: 'certificado',
  course_constancia: 'constancia',
  module: 'certificado',
};

/**
 * Ruta determinística para el asset de una plantilla, según su dueño único
 * (curso o módulo). Subir dos veces con la misma key sobrescribe el archivo
 * anterior en vez de generar un huérfano.
 */
export function buildCertificateTemplateKey(
  ownerType: CertificateTemplateOwnerType,
  ownerId: string,
  side: 'front' | 'back',
): string {
  const kind = KIND[ownerType];
  return `certificate-templates/${OWNER_PATH[ownerType]}/${ownerId}/${kind}-${side}`;
}
