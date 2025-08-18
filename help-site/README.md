# Drizzle Cube Help Site

Documentation and help center for Drizzle Cube - A Drizzle ORM-first semantic layer with Cube.js compatibility.

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development

```bash
# Install dependencies
npm install

# Start development server (includes content building)
npm run dev

# Build help content only
npm run build:help-content

# Watch help content for changes
npm run watch:help-content
```

The development server will start at `http://localhost:5174` (or next available port).

## Building

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

The built files will be in the `dist/` directory.

## Deployment to Cloudflare Workers

### Prerequisites
- Wrangler CLI installed globally: `npm install -g wrangler`
- Cloudflare account
- Authenticated with Cloudflare: `wrangler login`

### Deploy

```bash
# Deploy to production
npm run deploy

# Deploy to staging
npm run deploy:staging
```

### How it Works

The help site is deployed as a Cloudflare Worker that:
- Serves static files (HTML, CSS, JS) from the built assets
- Handles SPA routing by falling back to `index.html` for non-file routes
- Provides fast global CDN delivery

### Custom Domain Setup

After deployment, you can add a custom domain:
1. Go to Cloudflare Workers dashboard
2. Select your worker (`drizzle-cube-help`)
3. Go to Settings > Triggers
4. Add custom domain

## Architecture

### Content Management
- **Markdown source**: Content is written in Markdown files in `content/`
- **Build-time processing**: Markdown is converted to HTML with Tailwind CSS classes
- **Type-safe**: Content is compiled to TypeScript with proper type definitions
- **Search ready**: Content is processed for client-side search functionality

### Tech Stack
- **React 18** with TypeScript
- **React Router** for client-side routing
- **Tailwind CSS** for styling
- **Vite** for building and development
- **Prism.js** for syntax highlighting
- **Marked** for Markdown processing

### Features
- 📱 Responsive design
- 🎨 Syntax highlighting for code blocks
- 🔍 Client-side search
- 📖 Table of contents generation
- 🔗 Internal link handling
- 🌐 SEO-friendly with sitemap generation

## Content Structure

```
content/
├── getting-started/
│   ├── index.md
│   ├── installation.md
│   ├── quick-start.md
│   └── concepts.md
├── semantic-layer/
│   └── index.md
├── client/
│   └── index.md
└── adapters/
    └── hono.md
```

## Adding New Content

1. Create or edit Markdown files in the `content/` directory
2. Use internal links with `/help/` prefix: `[Link text](/help/topic-name)`
3. Run `npm run build:help-content` or use watch mode during development
4. Content will be automatically processed and made available in the app

## Customization

### Styling
- Edit `tailwind.config.js` for theme customization
- Modify CSS classes in `scripts/build-help-content.js` for content styling
- Custom CSS can be added to `index.html` for overrides

### Navigation
- Update `src/components/Navigation.tsx` to modify the sidebar navigation
- Navigation structure is defined in the `navigationSections` array

### Search
- Search functionality is built-in and works with processed content
- Modify `src/components/SearchInterface.tsx` to customize search behavior