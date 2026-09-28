export function getTrustedBrowserOrigins(
  frontendUrl = process.env.URL_FRONTEND,
  configuredHostnames = process.env.TURNSTILE_ALLOWED_HOSTNAMES,
): string[] {
  let frontend: URL;
  try {
    frontend = new URL(frontendUrl ?? '');
  } catch {
    return [];
  }

  const hostnames = configuredHostnames
    ?.split(',')
    .map((hostname) => hostname.trim().toLowerCase().replace(/\.$/, ''))
    .filter(Boolean);
  const allowedHostnames = new Set(
    hostnames?.length ? hostnames : [frontend.hostname],
  );

  return [...allowedHostnames].map((hostname) => {
    const origin = new URL(frontend.origin);
    origin.hostname = hostname;
    return origin.origin;
  });
}

export function isTrustedBrowserOrigin(
  origin: string,
  allowedOrigins = getTrustedBrowserOrigins(),
): boolean {
  try {
    const parsedOrigin = new URL(origin);
    return parsedOrigin.origin === origin && allowedOrigins.includes(origin);
  } catch {
    return false;
  }
}
