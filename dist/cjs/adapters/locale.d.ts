import { SecurityContext } from '../server/index.js';
export declare const DC_LOCALE_HEADER = "x-dc-locale";
export declare const DEFAULT_LOCALE = "en-GB";
type HeaderValue = string | string[] | null | undefined;
export declare function resolveRequestLocale(getHeader: (name: string) => HeaderValue): string | undefined;
export declare function withLocaleInSecurityContext(securityContext: SecurityContext, requestLocale?: string): SecurityContext;
export declare function ensureLocaleHeader(allowHeaders?: string[] | string): string[];
export {};
