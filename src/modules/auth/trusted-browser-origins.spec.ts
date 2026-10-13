import {
  getTrustedBrowserOrigins,
  isTrustedBrowserOrigin,
} from './trusted-browser-origins';

describe('trusted browser origins', () => {
  const origins = getTrustedBrowserOrigins(
    'https://www.escuelaglobal.net',
    'escuelaglobal.net,www.escuelaglobal.net,localhost',
  );

  it.each(['https://www.escuelaglobal.net', 'https://escuelaglobal.net'])(
    'accepts configured origin %s',
    (origin) => {
      expect(isTrustedBrowserOrigin(origin, origins)).toBe(true);
    },
  );

  it.each([
    'https://api.escuelaglobal.net',
    'http://www.escuelaglobal.net',
    'https://www.escuelaglobal.net:8443',
    'https://evil.example',
  ])('rejects untrusted origin %s', (origin) => {
    expect(isTrustedBrowserOrigin(origin, origins)).toBe(false);
  });

  it('keeps URL_FRONTEND as the default when no hostname allowlist is set', () => {
    expect(
      getTrustedBrowserOrigins('http://localhost:3000', undefined),
    ).toEqual(['http://localhost:3000']);
  });
});
