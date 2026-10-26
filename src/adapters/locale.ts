import type { SecurityContext } from "../server/index.js";

export const DC_LOCALE_HEADER = "x-dc-locale";
export const DEFAULT_LOCALE = "en-GB";

type HeaderValue = string | string[] | null | undefined;

function normalizeHeaderValue(value: HeaderValue): string | undefined {
  if (!value) return undefined;
  const stringValue = Array.isArray(value) ? value[0] : value;
  const firstToken = stringValue.split(",")[0]?.trim();
  if (!firstToken) return undefined;

  // Basic BCP-47-ish validation: letters, digits, and hyphens only
  if (!/^[A-Za-z0-9-]{2,35}$/.test(firstToken)) return undefined;
  return firstToken;
}

export function resolveRequestLocale(
  getHeader: (name: string) => HeaderValue,
): string | undefined {
  // No fallback to accept-language, if desired the embedding app can do it
  return normalizeHeaderValue(getHeader(DC_LOCALE_HEADER));
}

export function withLocaleInSecurityContext(
  securityContext: SecurityContext,
  requestLocale?: string,
): SecurityContext {
  const baseContext =
    securityContext && typeof securityContext === "object"
      ? securityContext
      : {};

  const existingLocale =
    typeof (baseContext as Record<string, unknown>).locale === "string"
      ? ((baseContext as Record<string, unknown>).locale as string)
      : undefined;

  const effectiveLocale = requestLocale ?? existingLocale ?? DEFAULT_LOCALE;

  if (existingLocale === effectiveLocale) {
    return baseContext;
  }

  return {
    ...baseContext,
    locale: effectiveLocale,
  };
}
