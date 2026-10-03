/**
 * The demo tenants, shared by the dev server and the dev client.
 *
 * Both need the same list — the server to validate an incoming override, the
 * client to offer the switcher — and they are separate bundles, so this sits
 * between them rather than being written twice.
 */

export const DEMO_ORGANISATIONS = [
  { id: 1, name: 'Acme Corp' },
  { id: 2, name: 'Globex' }
] as const

/**
 * Where the browser keeps the selected tenant.
 *
 * A cookie rather than localStorage because the browser attaches it to every
 * same-origin request by itself: the server reads the tenant with no client
 * plumbing, and it survives navigation, reloads and new tabs — none of which a
 * query parameter does, since every internal link would have to carry it.
 */
export const ORGANISATION_COOKIE = 'dc-organisation'
/** Explicit per-request override, for scripts and curl. */
export const ORGANISATION_HEADER = 'X-DC-Organisation'
/** Explicit override in a URL, so a tenant-scoped link can be shared. */
export const ORGANISATION_PARAM = 'org'

export const DEFAULT_ORGANISATION_ID = DEMO_ORGANISATIONS[0].id

const VALID_IDS = new Set<number>(DEMO_ORGANISATIONS.map(org => org.id))

export function isValidOrganisationId(raw: unknown): boolean {
  return VALID_IDS.has(Number(raw))
}

/** Unknown ids fall back rather than erroring — a typo should not blank the app. */
export function normaliseOrganisationId(raw: unknown): number {
  return isValidOrganisationId(raw) ? Number(raw) : DEFAULT_ORGANISATION_ID
}
