# Cloudflare Workers Deployment Guide

This guide explains how to deploy the Drizzle Cube Hono example to Cloudflare Workers.

## Prerequisites

1. **Cloudflare Account**: You need a Cloudflare account (free tier works)
2. **Neon Database**: Set up a Neon PostgreSQL database for production
3. **Node.js**: Version 20.13.1 or higher

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Authenticate with Cloudflare
```bash
npm run cf:login
```

### 3. Set Environment Variables
For local development with Wrangler:
```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars and add your DATABASE_URL
```

### 4. Set Production Secrets
```bash
# Set your production database URL
npx wrangler secret put DATABASE_URL
# When prompted, paste your Neon connection string
```

### 5. Test Locally
```bash
npm run dev:worker
```

### 6. Deploy to Production
```bash
npm run deploy
```

## Environment Configuration

### Local Development (.dev.vars)
```
DATABASE_URL=postgresql://username:password@ep-example-123.eu-central-1.aws.neon.tech/database?sslmode=require
NODE_ENV=development
```

### Production Secrets (via wrangler secret)
```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put JWT_SECRET  # if using JWT auth
```

## Neon Integration (Recommended)

For the best experience, use Cloudflare's Neon integration:

1. Go to your Cloudflare dashboard
2. Select "Workers & Pages" → "Overview"
3. Choose your deployed Worker
4. Go to "Settings" → "Integrations"
5. Select "Neon" and follow the OAuth flow
6. This automatically sets up DATABASE_URL and redeploys

## Scripts Reference

- `npm run dev:worker` - Start local development with Wrangler
- `npm run build:worker` - Build for Cloudflare Workers
- `npm run deploy` - Deploy to production
- `npm run deploy:staging` - Deploy to staging environment
- `npm run cf:login` - Authenticate with Cloudflare
- `npm run cf:whoami` - Check current authentication

## Architecture Notes

- **Runtime**: Cloudflare Workers (V8 isolates)
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle with `neon-http` driver
- **Framework**: Hono (lightweight, edge-optimized)
- **Build**: TypeScript → JavaScript (ESM)

## Key Differences from Node.js Version

1. **Entry Point**: Uses `src/worker.ts` instead of `src/index.ts`
2. **Database Driver**: Uses `@neondatabase/serverless` with HTTP fetch
3. **No File System**: All data must be in external services (Neon, KV, R2)
4. **Cold Starts**: Optimized for minimal cold start latency
5. **Edge Location**: Runs at 200+ Cloudflare edge locations globally

## Troubleshooting

### Common Issues

**1. "Module not found" errors**
- Ensure all dependencies are properly installed
- Check that `wrangler.toml` has correct `main` field

**2. Database connection errors**
- Verify DATABASE_URL is set correctly
- Ensure Neon database allows connections
- Check that `sslmode=require` is included in connection string

**3. Build failures**
- Run `npm run build:worker` to check for TypeScript errors
- Ensure `dist/worker.js` exists after build

**4. Local development issues**
- Use `.dev.vars` for local environment variables
- Make sure Wrangler is authenticated: `npm run cf:whoami`

**5. "process is not defined" errors**
- Cloudflare Workers don't have access to Node.js `process.env`
- Environment variables are accessed via `c.env.VARIABLE_NAME`
- The worker entry point (`src/worker.ts`) handles this differently than Node.js

### Useful Commands

```bash
# Check deployment status
npx wrangler list

# View logs in real-time
npx wrangler tail

# Test a specific route
curl https://your-worker.your-subdomain.workers.dev/health

# View worker analytics
npx wrangler pages logs
```

## Security Considerations

1. **Secrets Management**: Always use `wrangler secret put` for sensitive data
2. **CORS**: Configure appropriate CORS origins in production
3. **Rate Limiting**: Consider implementing rate limiting for public APIs
4. **Authentication**: Implement proper authentication for sensitive endpoints

## Cost Optimization

- **Free Tier**: 100,000 requests/day on Cloudflare free plan
- **Database**: Neon free tier includes 0.5GB storage and 3GB data transfer
- **Scaling**: Both services scale automatically based on usage
- **Global**: No additional cost for global edge distribution

## Next Steps

1. **Custom Domain**: Add your custom domain in Cloudflare dashboard
2. **Analytics**: Enable Cloudflare Analytics for usage insights  
3. **Caching**: Implement KV storage for caching expensive queries
4. **Monitoring**: Set up alerts and monitoring for production