# Installation

Get Drizzle Cube up and running in your project in just a few steps.

## Requirements

Before installing Drizzle Cube, make sure you have:

- **Node.js** 18 or higher
- **TypeScript** 5.0 or higher  
- **Drizzle ORM** 0.44.4 or higher
- A PostgreSQL or MySQL database (SQLite support coming soon)

## Package Installation

Install Drizzle Cube using your preferred package manager:

```bash
# npm
npm install drizzle-cube drizzle-orm

# yarn
yarn add drizzle-cube drizzle-orm

# pnpm
pnpm add drizzle-cube drizzle-orm
```

## Database Setup

### PostgreSQL

```bash
npm install postgres
# or for Neon serverless
npm install @neondatabase/serverless
```

### MySQL

```bash
npm install mysql2
```

### SQLite

```bash
npm install better-sqlite3
```

## Framework Adapters

Choose the adapter for your web framework:

### Express.js

```bash
npm install express cors
```

📖 [**Express Adapter Documentation**](/help/adapters/express) - Full setup guide with middleware integration

### Fastify

```bash
npm install fastify @fastify/cors
```

📖 [**Fastify Adapter Documentation**](/help/adapters/fastify) - High-performance plugin integration

### Hono (Recommended)

```bash
npm install hono
```

📖 [**Hono Adapter Documentation**](/help/adapters/hono) - Modern edge-runtime compatible adapter

### Next.js

```bash
npm install next
```

📖 [**Next.js Adapter Documentation**](/help/adapters/nextjs) - App Router integration with server components

### Custom Framework

You can create custom adapters for other frameworks. 

📖 [**Custom Adapters Guide**](/help/adapters/custom) - Build your own adapter for any framework

## React Components (Optional)

For dashboard and chart components:

```bash
npm install react react-dom recharts react-grid-layout
```

## TypeScript Configuration

Update your `tsconfig.json` to include proper module resolution:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

## Project Structure

Here's the recommended project structure:

```
your-project/
├── src/
│   ├── schema.ts              # Drizzle schema definition
│   ├── cubes.ts               # Semantic layer cubes
│   ├── server.ts              # Server setup with adapter
│   └── client/                # React components (optional)
│       ├── components/
│       └── pages/
├── drizzle.config.ts          # Drizzle configuration
├── package.json
└── tsconfig.json
```

## Environment Variables

Create a `.env` file with your database connection details:

```env
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# Neon PostgreSQL  
DATABASE_URL="postgresql://user:password@ep-example-123456.us-east-1.aws.neon.tech/dbname"

# MySQL (now supported)
DATABASE_URL="mysql://user:password@localhost:3306/mydb"

# SQLite (coming soon)  
# DATABASE_URL="file:./dev.db"
```

## Verification

Create a simple test file to verify your installation:

```typescript
// test.ts
import { createDatabaseExecutor } from 'drizzle-cube/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

const executor = createDatabaseExecutor(db, {}, 'postgres');
console.log('✅ Drizzle Cube installed successfully!');
```

Run the test:

```bash
npx tsx test.ts
```

## Next Steps

Now that Drizzle Cube is installed, you can:

1. [**Set up your first cube**](/help/getting-started/quick-start) - Build your first semantic layer
2. [**Learn core concepts**](/help/semantic-layer) - Understand cubes, dimensions, and measures
3. **Choose your adapter**:
   - [**Express.js**](/help/adapters/express) - Most popular Node.js framework
   - [**Fastify**](/help/adapters/fastify) - High-performance alternative
   - [**Hono**](/help/adapters/hono) - Modern edge-compatible framework
   - [**Next.js**](/help/adapters/nextjs) - React full-stack framework

## Troubleshooting

### Common Issues

**Module not found errors**
- Ensure you're using TypeScript 5.0+ and have proper module resolution configured
- Check that all peer dependencies are installed

**Database connection issues**  
- Verify your DATABASE_URL is correct
- Make sure your database server is running
- Check firewall and network settings

**TypeScript compilation errors**
- Update to the latest version of TypeScript
- Ensure your tsconfig.json includes the proper compiler options

Need more help? Check our [Troubleshooting Guide](/help/advanced/troubleshooting) or [report an issue](https://github.com/cliftonc/drizzle-cube/issues).