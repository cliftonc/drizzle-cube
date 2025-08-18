# Installation

Get Drizzle Cube up and running in your project in just a few steps.

## Requirements

Before installing Drizzle Cube, make sure you have:

- **Node.js** 18 or higher
- **TypeScript** 5.0 or higher  
- **Drizzle ORM** 0.44.4 or higher
- A supported database (PostgreSQL, MySQL, or SQLite)

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

### Hono (Recommended)

```bash
npm install hono
```

### Custom Framework

You can create custom adapters for other frameworks. See [Custom Adapters](/help/adapters/custom) for details.

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

# MySQL
DATABASE_URL="mysql://user:password@localhost:3306/mydb"

# SQLite
DATABASE_URL="file:./dev.db"
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

1. [**Set up your first cube**](/help/getting-started/quick-start)
2. [**Learn core concepts**](/help/getting-started/concepts)  
3. [**Explore the Hono adapter**](/help/adapters/hono)

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