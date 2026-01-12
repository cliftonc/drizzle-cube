---
name: setup
description: Configure Drizzle Cube plugin settings (API URL and authentication)
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

# Setup Command

Configure the Drizzle Cube plugin with your API URL and authentication token.

## Instructions

1. **Ask the user for configuration:**

Ask these questions to gather configuration:

**API URL:**
- What is your Drizzle Cube API URL?
- Default: `http://localhost:4000/cubejs-api/v1`
- Examples:
  - Local development: `http://localhost:4000/cubejs-api/v1`
  - Production: `https://api.example.com/cubejs-api/v1`

**Authentication Token:**
- Do you need authentication for your API?
- If yes, what is your API token?
- Leave blank for no authentication

**Configuration Scope:**
- Where should this configuration be saved?
  - **Project** (`.drizzle-cube.json` in current directory) - for project-specific config
  - **Global** (`~/.drizzle-cube/config.json`) - for user-wide default

2. **Create the configuration file:**

**Project config (`.drizzle-cube.json`):**
```json
{
  "apiUrl": "http://localhost:4000/cubejs-api/v1",
  "apiToken": "your-token-here"
}
```

**Global config (`~/.drizzle-cube/config.json`):**
```json
{
  "apiUrl": "http://localhost:4000/cubejs-api/v1",
  "apiToken": "your-token-here"
}
```

3. **Create the directory if needed:**

For global config:
```bash
mkdir -p ~/.drizzle-cube
```

4. **Write the config file:**

Use the Write tool to create the config file with the user's settings.

5. **Verify the configuration:**

After saving, show the user:
- Where the config was saved
- The API URL configured (mask the token for security)
- How to test the connection

**Test command:**
```bash
curl -s "${API_URL}/meta" -H "Authorization: Bearer ${TOKEN}" | head -c 200
```

6. **Explain configuration priority:**

The MCP server reads configuration in this order:
1. `.drizzle-cube.json` in current project directory
2. `~/.drizzle-cube/config.json` (global)
3. Environment variables (`DRIZZLE_CUBE_API_URL`, `DRIZZLE_CUBE_API_TOKEN`)

Project config takes precedence, allowing different settings per project.

## Output

Confirm the setup with:
- Config file location
- API URL (visible)
- Token status (configured/not configured - don't show the actual token)
- Next steps to test the connection
