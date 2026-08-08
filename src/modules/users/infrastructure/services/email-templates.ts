const BRAND_PRIMARY = '#084D95';
const BRAND_SUBTITLE = '#CFE3F5';
const BODY_BG = '#F2F4F8';
const TEXT_BODY = '#333333';
const TEXT_MUTED = '#8A93A3';
const FONT_FAMILY = "'Trebuchet MS', Verdana, Arial, sans-serif";

interface EmailLayoutOptions {
  previewText: string;
  logoUrl: string;
  headerSubtitle: string;
  bodyHtml: string;
}

function renderEmailLayout({
  previewText,
  logoUrl,
  headerSubtitle,
  bodyHtml,
}: EmailLayoutOptions): string {
  return `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Escuela Global</title>
  </head>
  <body style="margin:0; padding:0; background-color:${BODY_BG}; font-family:${FONT_FAMILY};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${previewText}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BODY_BG};">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:100%; background-color:#FFFFFF; border-radius:12px; border:1px solid #E5E9F0; overflow:hidden;">
            <tr>
              <td style="background-color:${BRAND_PRIMARY}; padding:28px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="width:56px; padding-right:14px;">
                      <table role="presentation" width="56" height="56" cellpadding="0" cellspacing="0" border="0" style="width:56px; height:56px; background-color:#FFFFFF; border-radius:14px;">
                        <tr>
                          <td align="center" valign="middle">
                            <img src="${logoUrl}" alt="Escuela Global" width="40" style="display:block; width:40px; max-width:40px;" />
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td valign="middle">
                      <div style="font-size:18px; font-weight:bold; color:#FFFFFF; letter-spacing:0.5px;">ESCUELA GLOBAL</div>
                      <div style="font-size:13px; color:${BRAND_SUBTITLE}; margin-top:2px;">${headerSubtitle}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px; color:${TEXT_BODY}; font-size:14px; line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px; border-top:1px solid #EEF1F6; font-size:12px; color:${TEXT_MUTED};">
                © ${new Date().getFullYear()} Escuela Global. Todos los derechos reservados.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

function renderButton(url: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td align="center" style="background-color:${BRAND_PRIMARY}; border-radius:999px;">
          <a href="${url}" target="_blank" style="display:inline-block; padding:12px 32px; font-size:14px; font-weight:bold; color:#FFFFFF; text-decoration:none;">${label}</a>
        </td>
      </tr>
    </table>
  `;
}

function greeting(firstName?: string): string {
  return firstName ? `Hola <strong>${firstName}</strong>,` : 'Hola,';
}

export function getVerificationTemplate(
  logoUrl: string,
  url: string,
  firstName?: string,
): string {
  const bodyHtml = `
    <p style="margin:0 0 16px;">${greeting(firstName)}</p>
    <p style="margin:0 0 16px;">Gracias por registrarte en Escuela Global. Para activar tu cuenta y comenzar tu ruta de aprendizaje, verifica tu correo electrónico:</p>
    ${renderButton(url, 'Verificar mi correo')}
    <p style="margin:20px 0 0; font-size:12px; color:${TEXT_MUTED};">Este enlace expirará en 24 horas.</p>
  `;

  return renderEmailLayout({
    previewText: 'Verifica tu correo para activar tu cuenta en Escuela Global',
    logoUrl,
    headerSubtitle: 'Bienvenido a la plataforma',
    bodyHtml,
  });
}

export function getRecoveryTemplate(
  logoUrl: string,
  url: string,
  firstName?: string,
): string {
  const bodyHtml = `
    <p style="margin:0 0 16px;">${greeting(firstName)}</p>
    <p style="margin:0 0 16px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el siguiente botón para crear una nueva:</p>
    ${renderButton(url, 'Restablecer contraseña')}
    <p style="margin:20px 0 0; font-size:12px; color:${TEXT_MUTED};">Si no solicitaste este cambio, puedes ignorar este correo.</p>
  `;

  return renderEmailLayout({
    previewText: 'Restablece la contraseña de tu cuenta de Escuela Global',
    logoUrl,
    headerSubtitle: 'Recuperación de contraseña',
    bodyHtml,
  });
}

export function getAccountCreatedTemplate(
  logoUrl: string,
  firstName: string,
  loginUrl: string,
): string {
  const bodyHtml = `
    <p style="margin:0 0 16px;">${greeting(firstName)}</p>
    <p style="margin:0 0 16px;">Se ha creado una cuenta para ti en Escuela Global. Ya puedes iniciar sesión con tus credenciales y comenzar a explorar la plataforma:</p>
    ${renderButton(loginUrl, 'Iniciar sesión')}
    <p style="margin:20px 0 0; font-size:12px; color:${TEXT_MUTED};">Si no esperabas este correo, por favor contacta a soporte.</p>
  `;

  return renderEmailLayout({
    previewText: 'Tu cuenta de Escuela Global ya está lista',
    logoUrl,
    headerSubtitle: 'Tu cuenta está lista',
    bodyHtml,
  });
}
