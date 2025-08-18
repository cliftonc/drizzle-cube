export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle SPA routing - if the path doesn't exist as a file, serve index.html
    try {
      // Try to fetch the asset first
      const assetResponse = await env.ASSETS.fetch(request.url);
      
      // If it's a successful response, return it
      if (assetResponse.status < 400) {
        return assetResponse;
      }
      
      // If it's a 404 and the path looks like a route (not a file extension), serve index.html
      if (assetResponse.status === 404 && !url.pathname.includes('.')) {
        const indexRequest = new Request(new URL('/index.html', request.url).toString(), request);
        return env.ASSETS.fetch(indexRequest);
      }
      
      // Otherwise return the original response (404, etc.)
      return assetResponse;
    } catch (error) {
      // If there's an error fetching, try to serve index.html for SPA routing
      if (!url.pathname.includes('.')) {
        const indexRequest = new Request(new URL('/index.html', request.url).toString(), request);
        return env.ASSETS.fetch(indexRequest);
      }
      
      // Return a generic 404 for actual files
      return new Response('Not Found', { status: 404 });
    }
  },
};