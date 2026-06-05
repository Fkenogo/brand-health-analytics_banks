const CANONICAL_ADMIN_ORIGIN = 'https://www.brandedgeafrica.com';

export const isFirebaseHostedOrigin = (hostname: string): boolean => {
  const normalized = hostname.toLowerCase();
  return normalized.endsWith('.web.app') || normalized.endsWith('.firebaseapp.com');
};

export const shouldRedirectAdminToCanonicalHost = (hostname: string): boolean => isFirebaseHostedOrigin(hostname);

export const getCanonicalAdminUrl = (pathname: string, search = ''): string => {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${CANONICAL_ADMIN_ORIGIN}${normalizedPath}${search}`;
};

export const ADMIN_BOOTSTRAP_TIMEOUT_MS = 6500;
