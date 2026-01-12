# Drizzle Cube Claude Code Plugin

A comprehensive Claude Code plugin for [Drizzle Cube](https://try.drizzle-cube.dev) - the Drizzle ORM-first semantic layer with type-safe analytics and dashboards.

## Installation

### Direct Install

```bash
/plugin install drizzle-cube@github.com/cliftonc/drizzle-cube
```

### Via Marketplace

Add the Drizzle Cube marketplace first:

```bash
/plugin marketplace add cliftonc/drizzle-cube
```

Then browse and install plugins:

```bash
/plugin marketplace list
/plugin install drizzle-cube
```

## Features

### Skills

The plugin provides 5 comprehensive skills with documentation and examples:

| Skill | Description |
|-------|-------------|
| **cube-definition** | Create cube definitions with measures, dimensions, security context, and joins |
| **analysis-config** | Build AnalysisConfig objects for query, funnel, and flow analysis |
| **dashboard-config** | Configure dashboards with portlets, layouts, and filters |
| **chart-config** | Configure chart axis mappings and display options for all chart types |
| **query-building** | Build semantic queries with filters, time dimensions, and aggregations |

### Slash Commands

Quick-access commands for common workflows:

| Command | Description |
|---------|-------------|
| `/drizzle-cube:setup` | **Configure API URL and authentication interactively** |
| `/drizzle-cube:create-cube <name>` | Create a new cube definition from a Drizzle table |
| `/drizzle-cube:create-dashboard <name>` | Create a new dashboard configuration |
| `/drizzle-cube:add-chart <description>` | Add a chart to an existing dashboard |
| `/drizzle-cube:query <description>` | Build a semantic query interactively |
| `/drizzle-cube:debug <query>` | Debug a query with dry-run and explain |

### MCP Server Tools

Live API access to your Drizzle Cube instance:

| Tool | Description |
|------|-------------|
| `drizzle_cube_config` | **Check current configuration status** |
| `drizzle_cube_meta` | Fetch cube metadata (measures, dimensions, relationships) |
| `drizzle_cube_dry_run` | Validate query and preview generated SQL |
| `drizzle_cube_explain` | Get query execution plan with performance analysis |
| `drizzle_cube_load` | Execute a query and return results |
| `drizzle_cube_batch` | Execute multiple queries in parallel |

## MCP Server Setup

### 1. Build the MCP Server

```bash
cd mcp-server
npm install
npm run build
```

### 2. Configure the Plugin

You have three options for configuration (in priority order):

#### Option A: Interactive Setup (Recommended)

Run the setup command in Claude Code:

```
/drizzle-cube:setup
```

This will guide you through:
- Setting your API URL
- Configuring authentication
- Choosing project or global config

#### Option B: Project Config File

Create `.drizzle-cube.json` in your project root:

```json
{
  "apiUrl": "http://localhost:4000/cubejs-api/v1",
  "apiToken": "your-auth-token"
}
```

This is ideal for project-specific configurations.

#### Option C: Global Config File

Create `~/.drizzle-cube/config.json`:

```bash
mkdir -p ~/.drizzle-cube
```

```json
{
  "apiUrl": "http://localhost:4000/cubejs-api/v1",
  "apiToken": "your-auth-token"
}
```

This applies to all projects as a default.

#### Option D: Environment Variables (Fallback)

```bash
export DRIZZLE_CUBE_API_URL=http://localhost:4000/cubejs-api/v1
export DRIZZLE_CUBE_API_TOKEN=your-auth-token
```

### Configuration Priority

The MCP server reads configuration in this order:
1. **Project config** (`.drizzle-cube.json` in current directory)
2. **Global config** (`~/.drizzle-cube/config.json`)
3. **Environment variables**
4. **Defaults** (localhost:4000)

### 3. Verify Configuration

Check your current configuration by asking Claude:

```
Use drizzle_cube_config to show my current configuration
```

Or test the connection:

```
Fetch the cube metadata using drizzle_cube_meta
```

## Usage Examples

### Creating a New Cube

```
/drizzle-cube:create-cube Orders orders
```

Claude will:
1. Find your Drizzle schema
2. Analyze the `orders` table structure
3. Generate a cube definition with appropriate measures and dimensions
4. Ensure security context is properly configured

### Building a Dashboard

```
/drizzle-cube:create-dashboard "Sales Overview"
```

Claude will guide you through:
1. Selecting the data to display
2. Choosing appropriate chart types
3. Laying out the dashboard grid
4. Configuring filters

### Interactive Query Building

```
/drizzle-cube:query show me revenue by product category for last quarter
```

Claude will:
1. Identify relevant cubes and fields
2. Build the appropriate CubeQuery
3. Suggest a suitable chart type
4. Provide the query in multiple formats (JSON, AnalysisConfig, cURL)

### Debugging Queries

```
/drizzle-cube:debug {"measures": ["Sales.totalRevenue"], "dimensions": ["Products.category"]}
```

Claude will:
1. Validate the query structure
2. Show the generated SQL
3. Analyze the execution plan
4. Provide performance recommendations

## Key Concepts

### Security Context

Every cube must implement security filtering for multi-tenant isolation:

```typescript
sql: (securityContext) => eq(table.organisationId, securityContext.organisationId)
```

### AnalysisConfig

The canonical format for persisting analysis state:

```typescript
{
  version: 1,
  analysisType: 'query' | 'funnel' | 'flow',
  activeView: 'table' | 'chart',
  charts: { /* per-mode chart config */ },
  query: { /* the actual query */ }
}
```

### Dashboard Portlets

Dashboard widgets use a 12-column grid layout:

```typescript
{
  id: 'unique-id',
  title: 'Chart Title',
  w: 6, h: 4, x: 0, y: 0,  // Grid position
  analysisConfig: { /* ... */ }
}
```

## Resources

- [Drizzle Cube Documentation](https://try.drizzle-cube.dev)
- [GitHub Repository](https://github.com/cliftonc/drizzle-cube)
- [Drizzle ORM](https://orm.drizzle.team)

## License

MIT - see the [main repository](https://github.com/cliftonc/drizzle-cube) for details.
