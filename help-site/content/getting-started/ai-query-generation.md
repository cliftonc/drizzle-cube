# AI Query Generation

Convert natural language questions into powerful analytical queries using AI assistance. Drizzle Cube's AI Query Generation feature leverages modern AI models to help you explore your data without writing complex queries.

## Overview

The AI Query Generation feature allows users to:

- **Natural Language Queries**: Ask questions like "Show me employee count by department" or "What are the sales trends this quarter?"
- **Smart Query Building**: AI understands your cube schema and generates valid Cube.js queries
- **Interactive Validation**: Queries are automatically validated against your API before execution
- **Customizable Endpoints**: Bring your own AI model or provider

The system uses a server-side AI service to convert natural language into structured Cube.js queries, ensuring security and allowing for custom system prompts and business logic.

## How It Works

1. **Schema Awareness**: The AI has access to your complete cube schema including measures, dimensions, and relationships
2. **Natural Language Processing**: User questions are processed using AI models (default: Google Gemini)
3. **Query Generation**: AI generates valid JSON queries following Cube.js format
4. **Automatic Validation**: Generated queries are tested against your API to ensure they work
5. **One-Click Execution**: Valid queries can be loaded directly into the Query Builder

## Implementation

### Basic Setup

The AI feature is enabled by default in the Query Builder. To get started:

```typescript
import { CubeProvider, QueryBuilder } from 'drizzle-cube/client'

function App() {
  return (
    <CubeProvider
      apiOptions={{ apiUrl: '/cubejs-api/v1' }}
      features={{ enableAI: true }} // Default: true
    >
      <QueryBuilder />
    </CubeProvider>
  )
}
```

### Server-Side AI Routes

You need to implement AI routes on your server. Here's an example using Hono (from `examples/hono/src/ai-routes.ts`):

```typescript
import { Hono } from 'hono'
import { SemanticLayerCompiler } from 'drizzle-cube/server'

const aiApp = new Hono()

// System prompt template that includes your cube schema
const SYSTEM_PROMPT_TEMPLATE = `You are a helpful AI assistant for analyzing business data using Cube.js/Drizzle-Cube semantic layer.

Given the following cube schema and user query, generate a valid JSON query for the Cube.js API.

CUBE SCHEMA:
{CUBE_SCHEMA}

Valid query structure:
{
  dimensions?: string[], // dimension names from CUBE SCHEMA
  measures?: string[], // measure names from CUBE SCHEMA
  timeDimensions?: [{
    dimension: string, // time dimension from CUBE SCHEMA
    granularity?: 'day'|'week'|'month'|'quarter'|'year',
    dateRange?: [string, string] | string // 'last year' 'this year' or ['2024-01-01','2024-12-31']
  }],
  filters?: [{
    member: string, // dimension/measure from CUBE SCHEMA
    operator: 'equals'|'notEquals'|'contains'|'gt'|'gte'|'lt'|'lte'|'inDateRange'|'set'|'notSet',
    values?: any[] // required unless set/notSet
  }],
  order?: {[member: string]: 'asc'|'desc'},
  limit?: number
}

USER QUERY:
{USER_PROMPT}

Return the JSON query:`

aiApp.post('/generate', async (c) => {
  const { text } = await c.req.json()
  
  // Validate request format
  if (!text) {
    return c.json({ error: 'Please provide "text" field with your prompt.' }, 400)
  }
  
  // Build schema from your cubes
  const cubeSchema = formatCubeSchemaForAI(db)
  const finalPrompt = SYSTEM_PROMPT_TEMPLATE
    .replace('{CUBE_SCHEMA}', cubeSchema)
    .replace('{USER_PROMPT}', text)
  
  // Call your AI provider (Gemini, OpenAI, etc.)
  const response = await callAIProvider(finalPrompt)
  
  // Extract the query from AI response and return simplified format
  const queryText = response.candidates?.[0]?.content?.parts?.[0]?.text
  
  return c.json({
    query: queryText
  })
})

export default aiApp
```

### Rate Limiting and Security

The example implementation includes built-in security features:

- **Rate Limiting**: Server API keys have daily limits to prevent abuse
- **Input Sanitization**: User prompts are sanitized to prevent injection attacks
- **Validation**: Generated queries are validated against your actual API
- **Custom Keys**: Users can provide their own API keys to bypass rate limits

```typescript
// Rate limiting configuration
const MAX_GEMINI_CALLS = parseInt(process.env.MAX_GEMINI_CALLS || '10')

// Input validation
function validatePrompt(text: string): { isValid: boolean; message?: string } {
  if (text.length > 500) {
    return { isValid: false, message: 'Prompt too long' }
  }
  // Additional validation...
  return { isValid: true }
}
```

## Customization

### Custom AI Endpoints

You can configure the AI endpoint to use your own AI service:

```typescript
<CubeProvider
  apiOptions={{ apiUrl: '/cubejs-api/v1' }}
  features={{ 
    enableAI: true,
    aiEndpoint: '/api/my-custom-ai/generate' // Complete custom endpoint
  }}
>
  <QueryBuilder />
</CubeProvider>
```

### Bring Your Own Model

The system is designed to work with any AI provider. Simply implement the same API interface:

```typescript
// Your custom AI endpoint should accept this generic format:
POST /api/my-custom-ai/generate
{
  "text": "Show me employee count by department"
}

// And return this simplified format:
{
  "query": "{\"measures\":[\"Employees.count\"],\"dimensions\":[\"Departments.name\"]}"
}
```

### Custom System Prompts

System prompts should be customized server-side based on your specific use case:

```typescript
const CUSTOM_SYSTEM_PROMPT = `You are an expert in ${YOUR_DOMAIN} analytics.
Focus on these key metrics: ${KEY_METRICS}.
Always consider these business rules: ${BUSINESS_RULES}.
...`
```

## Best Practices

### For Implementation

1. **Keep System Prompts Server-Side**: This allows you to customize prompts without client updates
2. **Implement Rate Limiting**: Protect your AI API costs with sensible limits
3. **Validate All Queries**: Always test generated queries against your actual API
4. **Provide Custom Keys**: Let power users bring their own API keys

### For Users

1. **Be Specific**: "Employee count by department this year" works better than "show employees"
2. **Use Business Terms**: The AI understands your cube schema, so use the same terms
3. **Start Simple**: Begin with basic queries and add complexity gradually
4. **Review Before Running**: Always check the generated query makes sense

## Configuration Options

The AI feature supports these configuration options:

```typescript
interface FeaturesConfig {
  enableAI?: boolean        // Enable/disable AI features (default: true)
  aiEndpoint?: string       // Custom AI endpoint (default: '/api/ai/generate')
}
```

## Security Considerations

### Server-Side Processing

- All AI processing happens server-side to protect API keys
- System prompts are not exposed to the client
- User input is validated and sanitized before processing

### API Key Management

- Server provides rate-limited access with shared keys
- Users can override with their own keys for unlimited access
- Keys are stored locally and never transmitted in logs

### Query Validation

- All generated queries are tested against your API
- Invalid queries are caught before execution
- No arbitrary code execution - only valid JSON queries

## Troubleshooting

### Common Issues

**AI Button Not Showing**
```typescript
// Ensure AI is enabled in features
features={{ enableAI: true }}
```

**Rate Limit Errors**
```typescript
// Users can provide their own API key to bypass limits
// Or increase MAX_GEMINI_CALLS on server
```

**Invalid Queries Generated**
```typescript
// Check your cube schema formatting in the system prompt
// Ensure dimension/measure names are clearly defined
```

### Getting Help

- Check the browser console for detailed error messages
- Review the AI endpoint logs for processing details
- Test the `/api/ai/health` endpoint to verify configuration

The AI Query Generation feature makes analytics accessible to all users while maintaining the power and type safety of Drizzle Cube's semantic layer.