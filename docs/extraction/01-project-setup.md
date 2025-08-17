# Phase 1: Project Setup

**Objective**: Create the basic folder structure and build system for the `drizzle-cube` module.

**Duration**: 2-3 hours  
**Prerequisites**: Node.js 18+, npm/yarn, Git

## Step 1: Create Module Directory

1. Navigate to the parent directory where you want to create the module:

```bash
cd /path/to/your/projects
```

2. Create the module directory:

```bash
mkdir drizzle-cube
cd drizzle-cube
```

3. Initialize Git repository:

```bash
git init
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo "dist/" >> .gitignore
echo ".DS_Store" >> .gitignore
echo "*.log" >> .gitignore
```

## Step 2: Create Folder Structure

Create the complete folder structure:

```bash
# Core source directories
mkdir -p src/server
mkdir -p src/client
mkdir -p src/adapters/hono

# Example applications
mkdir -p examples/basic
mkdir -p examples/hono-app

# Documentation site
mkdir -p help-site/src/components
mkdir -p help-site/src/content
mkdir -p help-site/src/assets

# Build outputs
mkdir -p dist

# Development
mkdir -p tests
```

Your folder structure should now look like:

```
drizzle-cube/
├── src/
│   ├── server/
│   ├── client/
│   └── adapters/
│       └── hono/
├── examples/
│   ├── basic/
│   └── hono-app/
├── help-site/
│   └── src/
│       ├── components/
│       ├── content/
│       └── assets/
├── tests/
├── dist/
└── .gitignore
```

## Step 3: Initialize Package.json

Create the main `package.json`:

```bash
npm init -y
```

Replace the generated `package.json` with this complete configuration:

```json
{
  "name": "drizzle-cube",
  "version": "0.1.0",
  "description": "A Cube.js-compatible semantic layer for Drizzle ORM with React analytics dashboard",
  "main": "./dist/server/index.js",
  "types": "./dist/server/index.d.ts",
  "type": "module",
  "exports": {
    "./server": {
      "types": "./dist/server/index.d.ts",
      "import": "./dist/server/index.js"
    },
    "./client": {
      "types": "./dist/client/index.d.ts",
      "import": "./dist/client/index.js"
    },
    "./adapters/hono": {
      "types": "./dist/adapters/hono/index.d.ts",
      "import": "./dist/adapters/hono/index.js"
    }
  },
  "files": [
    "dist/",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\" \"npm run dev:examples\"",
    "dev:server": "vite build src/server --watch --mode development",
    "dev:client": "vite build src/client --watch --mode development",
    "dev:examples": "cd examples/hono-app && npm run dev",
    "dev:help": "cd help-site && npm run dev",
    "build": "npm run build:server && npm run build:client && npm run build:adapters && npm run build:help",
    "build:server": "vite build --config vite.config.server.ts",
    "build:client": "vite build --config vite.config.client.ts",
    "build:adapters": "vite build --config vite.config.adapters.ts",
    "build:help": "cd help-site && npm run build",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "prepublishOnly": "npm run build && npm run test && npm run typecheck"
  },
  "keywords": [
    "drizzle",
    "cube",
    "cubejs", 
    "semantic-layer",
    "analytics",
    "dashboard",
    "react",
    "typescript"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "homepage": "https://drizzle-cube.dev",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/drizzle-cube.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/drizzle-cube/issues"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "drizzle-orm": "^0.33.0"
  },
  "peerDependenciesMeta": {
    "react": {
      "optional": false
    },
    "react-dom": {
      "optional": false
    },
    "drizzle-orm": {
      "optional": false
    }
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "concurrently": "^8.0.0",
    "eslint": "^8.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vite-plugin-dts": "^4.0.0",
    "vitest": "^2.0.0"
  },
  "dependencies": {
    "@heroicons/react": "^2.0.0",
    "recharts": "^2.8.0",
    "react-grid-layout": "^1.4.0",
    "react-hook-form": "^7.47.0",
    "zod": "^3.22.0"
  }
}
```

## Step 4: TypeScript Configuration

Create the main `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "allowJs": false,
    
    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    
    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    /* Module Resolution */
    "baseUrl": ".",
    "paths": {
      "@/server/*": ["./src/server/*"],
      "@/client/*": ["./src/client/*"],
      "@/adapters/*": ["./src/adapters/*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "examples",
    "help-site"
  ]
}
```

Create separate TypeScript configs for different builds:

**tsconfig.server.json**:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2023"],
    "jsx": "preserve"
  },
  "include": ["src/server/**/*.ts"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}
```

**tsconfig.client.json**:
```json
{
  "extends": "./tsconfig.json",
  "include": ["src/client/**/*.ts", "src/client/**/*.tsx"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}
```

## Step 5: Vite Build Configurations

Create separate Vite configs for each build target:

**vite.config.server.ts**:
```typescript
import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      include: ['src/server/**/*.ts'],
      tsconfigPath: './tsconfig.server.json'
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/server/index.ts'),
      name: 'DrizzleCubeServer',
      formats: ['es'],
      fileName: 'index'
    },
    outDir: 'dist/server',
    rollupOptions: {
      external: ['drizzle-orm'],
      output: {
        globals: {
          'drizzle-orm': 'DrizzleORM'
        }
      }
    }
  }
})
```

**vite.config.client.ts**:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      include: ['src/client/**/*.ts', 'src/client/**/*.tsx'],
      tsconfigPath: './tsconfig.client.json'
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/client/index.ts'),
      name: 'DrizzleCubeClient',
      formats: ['es'],
      fileName: 'index'
    },
    outDir: 'dist/client',
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime'
        }
      }
    }
  }
})
```

**vite.config.adapters.ts**:
```typescript
import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      include: ['src/adapters/**/*.ts']
    })
  ],
  build: {
    lib: {
      entry: {
        'hono/index': resolve(__dirname, 'src/adapters/hono/index.ts')
      },
      formats: ['es']
    },
    outDir: 'dist/adapters',
    rollupOptions: {
      external: ['hono']
    }
  }
})
```

## Step 6: ESLint Configuration

Create `.eslintrc.json`:

```json
{
  "root": true,
  "env": { "browser": true, "es2020": true, "node": true },
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended"
  ],
  "ignorePatterns": ["dist", ".eslintrc.cjs"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

## Step 7: Install Dependencies

Install all development dependencies:

```bash
npm install
```

## Step 8: Create Initial Files

Create placeholder files to verify the structure:

**src/server/index.ts**:
```typescript
// Placeholder - will be implemented in Phase 2
export * from './types'

export class SemanticLayer {
  // Implementation coming in Phase 2
}
```

**src/client/index.ts**:
```typescript
// Placeholder - will be implemented in Phase 4
export { AnalyticsPage } from './components/AnalyticsPage'
```

**src/adapters/hono/index.ts**:
```typescript
// Placeholder - will be implemented in Phase 3
export function createHonoRoutes() {
  // Implementation coming in Phase 3
}
```

**src/server/types.ts**:
```typescript
// Basic types - will be expanded in Phase 2
export interface SecurityContext {
  [key: string]: any
}

export interface SemanticQuery {
  measures?: string[]
  dimensions?: string[]
  filters?: any[]
}
```

## Step 9: Create License

Create `LICENSE` file (MIT License):

```
MIT License

Copyright (c) 2024 Drizzle Cube

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Step 10: Verification

Test that everything is set up correctly:

1. **Check TypeScript compilation**:
```bash
npm run typecheck
```

2. **Check linting**:
```bash
npm run lint
```

3. **Test build system**:
```bash
npm run build
```

4. **Verify folder structure**:
```bash
tree . -I node_modules
```

You should see:
```
drizzle-cube/
├── dist/
│   ├── adapters/
│   ├── client/
│   └── server/
├── examples/
├── help-site/
├── src/
├── tests/
├── package.json
├── tsconfig.json
├── vite.config.*.ts
├── .eslintrc.json
├── LICENSE
└── .gitignore
```

## Step 11: Initial Git Commit

```bash
git add .
git commit -m "Initial project setup for drizzle-cube module"
```

## ✅ Checkpoint

You should now have:
- [ ] Complete folder structure
- [ ] Package.json with correct exports
- [ ] TypeScript configurations for all builds
- [ ] Vite build system that produces three outputs
- [ ] ESLint configuration
- [ ] Placeholder source files
- [ ] All builds complete without errors
- [ ] Initial git commit

**Estimated time**: If you followed all steps exactly, this should take 2-3 hours.

## Troubleshooting

**Build errors**: Verify all config files match exactly  
**TypeScript errors**: Check that all placeholder files exist  
**Missing dependencies**: Run `npm install` again  
**Permission errors**: Check folder permissions

---

**Next Step**: Proceed to [02-extract-server-core.md](./02-extract-server-core.md)