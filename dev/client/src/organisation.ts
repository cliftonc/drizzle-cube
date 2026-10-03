/**
 * Which demo tenant the dev app is viewing as.
 *
 * Per-tenant cube sets only mean anything if you can be more than one tenant:
 * organisation 1 and 2 define different user-defined attributes, so `/meta`
 * returns a different set of dimensions for each.
 *
 * The selection lives in a **cookie**. The browser then attaches it to every
 * same-origin request on its own, so the server reads the tenant with no client
 * plumbing at all, and it survives navigation, reloads and new tabs. A query
 * parameter could not: every internal link would have to carry it, and the
 * first `<Link>` that did not would silently drop you back to the default
 * tenant — which made the second organisation's dashboards unreachable.
 *
 * Real deployments take the tenant from a session or a JWT; this is a demo
 * affordance, which is why it lives in `dev/` rather than the library.
 */

import {
  DEFAULT_ORGANISATION_ID,
  DEMO_ORGANISATIONS,
  ORGANISATION_COOKIE,
  ORGANISATION_PARAM,
  isValidOrganisationId,
  normaliseOrganisationId
} from '../../shared/organisations'

export { DEMO_ORGANISATIONS }

/** The tenant currently selected. */
export function getOrganisationId(): number {
  if (typeof document === 'undefined') return DEFAULT_ORGANISATION_ID
  return normaliseOrganisationId(readCookie(ORGANISATION_COOKIE))
}

/**
 * Switch tenant, then reload.
 *
 * The reload is deliberate: the cube metadata, the query cache and the
 * dashboard list are all tenant-scoped, and dropping all three at once is
 * honest where invalidating them piecemeal would leave stale corners.
 */
export function setOrganisationId(id: number): void {
  writeCookie(ORGANISATION_COOKIE, String(normaliseOrganisationId(id)))
  window.location.reload()
}

/**
 * Adopt a `?org=` parameter into the cookie, then strip it from the URL.
 *
 * Lets a tenant-scoped link be pasted or shared, while keeping the cookie the
 * single source of truth afterwards — a parameter left in the address bar would
 * otherwise quietly outrank the switcher on every later navigation.
 */
export function adoptOrganisationFromUrl(): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const raw = url.searchParams.get(ORGANISATION_PARAM)
  if (raw === null) return

  if (isValidOrganisationId(raw)) {
    writeCookie(ORGANISATION_COOKIE, String(Number(raw)))
  }
  url.searchParams.delete(ORGANISATION_PARAM)
  window.history.replaceState(null, '', url.toString())
}

function readCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find(entry => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

function writeCookie(name: string, value: string): void {
  // A session cookie would be lost on browser restart, which is a surprising
  // way to change tenant; a year is plenty for a demo. `Lax` survives normal
  // navigation but not cross-site requests, and there is no `Secure` because
  // the dev server is plain http on localhost.
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
}
