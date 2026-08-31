/**
 * Which demo tenant a request belongs to.
 *
 * The dev server has no real auth, but per-tenant cube sets are only
 * demonstrable if you can be more than one tenant: organisation 1 and 2 define
 * *different* attributes, so `/cubejs-api/v1/meta` returns a different set of
 * dimensions for each. This resolves the tenant from an explicit override so
 * the dev client can switch between them.
 *
 * A real deployment would take this from the session or a JWT — see
 * `extractSecurityContext` in `app.ts`.
 */

import { getCookie } from 'hono/cookie'
import type { Context } from 'hono'
import {
  ORGANISATION_COOKIE,
  ORGANISATION_HEADER,
  ORGANISATION_PARAM,
  isValidOrganisationId,
  normaliseOrganisationId
} from '../shared/organisations.js'

/**
 * Resolve the organisation for a request.
 *
 * Explicit overrides win over the ambient selection, so a script or a shared
 * link can address a tenant without disturbing the browser's own:
 *
 * 1. `X-DC-Organisation` — a deliberate per-request choice (curl, tests).
 * 2. `?org=` — a deliberate choice in a URL.
 * 3. The cookie the switcher sets, which the browser sends automatically.
 *
 * Unknown ids fall through rather than erroring — this is a demo, and a typo
 * should not produce a blank app.
 */
export function resolveOrganisationId(c: Context): number {
  const candidates = [
    c.req.header(ORGANISATION_HEADER) ?? c.req.header(ORGANISATION_HEADER.toLowerCase()),
    c.req.query(ORGANISATION_PARAM),
    getCookie(c, ORGANISATION_COOKIE)
  ]

  return normaliseOrganisationId(candidates.find(isValidOrganisationId))
}
