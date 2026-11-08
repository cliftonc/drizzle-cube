import { describe, it, expect } from 'vitest'
import { getCubeTools } from '../../src/adapters/mcp-tools'
import type { GetCubeToolsOptions } from '../../src/adapters/mcp-tools'
import { MCP_APP_RESOURCE_URI } from '../../src/adapters/mcp-transport'
import { SemanticLayerCompiler } from '../../src/server'

/**
 * `getCubeTools({ app })` takes the MCP App HTML from the host (#1423), so
 * `drizzle-cube/mcp` never imports the ~2 MB document itself.
 */
const HTML = '<!DOCTYPE html><html><head><title>app</title></head><body>host-supplied-app</body></html>'

function tools(app?: GetCubeToolsOptions['app']) {
  return getCubeTools({
    semanticLayer: new SemanticLayerCompiler({ engineType: 'sqlite' }),
    getSecurityContext: async () => ({ organisationId: 'org1' }),
    tools: ['discover', 'validate', 'load', 'chart'] as GetCubeToolsOptions['tools'],
    app
  })
}

const appResource = (t: ReturnType<typeof tools>) => t.resources.find(r => r.uri === MCP_APP_RESOURCE_URI)

describe('getCubeTools app option', () => {
  it('has no app resource and no chart tool by default', () => {
    for (const t of [tools(), tools(false)]) {
      expect(appResource(t)).toBeUndefined()
      expect(t.toolNames).not.toContain('drizzle_cube_chart')
    }
  })

  it('serves the host-supplied HTML with the locale config injected', () => {
    const t = tools({ html: HTML, defaultLocale: 'nl-NL', detectBrowserLocale: false })
    const resource = appResource(t)
    expect(resource?.text).toContain('host-supplied-app')
    expect(resource?.text).toContain('"defaultLocale":"nl-NL"')
    expect(resource?.text).toContain('"detectBrowserLocale":false')
    expect(t.toolNames).toContain('drizzle_cube_chart')
  })

  it('does not put the html option into the injected config', () => {
    const text = appResource(tools({ html: HTML, defaultLocale: 'en-US' }))?.text ?? ''
    expect(text.match(/host-supplied-app/g)).toHaveLength(1)
  })

  it('leaves out the resource when the HTML is an empty stub', () => {
    expect(appResource(tools({ html: '' }))).toBeUndefined()
  })

  it.each([
    ['app: true (the 0.12 form)', true],
    ['a config without html', { defaultLocale: 'nl-NL' }],
    ['a non-string html', { html: 42 }]
  ])('throws a migration error for %s', (_label, app) => {
    // Deliberately outside the types: JavaScript callers and 0.12 call sites.
    const call = () => tools(app as unknown as GetCubeToolsOptions['app'])
    expect(call).toThrow(TypeError)
    expect(call).toThrow("import { mcpAppHtml } from 'drizzle-cube/mcp-app-html'")
  })
})
