import { marked } from 'marked';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentDir = path.join(__dirname, '../content');
const outputFile = path.join(__dirname, '../src/help-content.ts');
const sitemapFile = path.join(__dirname, '../public/sitemap.xml');

// Configure marked with custom renderer for Tailwind CSS classes
const renderer = new marked.Renderer();

// Override heading renderer to add anchor IDs and Tailwind classes
renderer.heading = function(token) {
  const headingText = this.parser.parseInline(token.tokens);
  const anchor = token.text.toLowerCase()
    .replace(/[^\w\- ]/g, '')
    .replace(/\s+/g, '-');
  
  const classes = {
    1: 'text-4xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-drizzle-500',
    2: 'text-3xl font-semibold text-gray-800 mt-8 mb-4',
    3: 'text-2xl font-medium text-gray-700 mt-6 mb-3',
    4: 'text-xl font-medium text-gray-700 mt-4 mb-2',
    5: 'text-lg font-medium text-gray-600 mt-3 mb-2',
    6: 'text-base font-medium text-gray-600 mt-2 mb-1'
  };
  
  return `<h${token.depth} id="${anchor}" class="${classes[token.depth] || classes[6]}">${headingText}</h${token.depth}>`;
};

// Override paragraph renderer
renderer.paragraph = function(token) {
  return `<p class="mb-4 text-gray-600 leading-relaxed">${this.parser.parseInline(token.tokens)}</p>`;
};

// Override list renderers - properly handle inline formatting
renderer.list = function(token) {
  const tag = token.ordered ? 'ol' : 'ul';
  const classes = token.ordered 
    ? 'list-decimal list-inside mb-4 space-y-2 text-gray-600 ml-4'
    : 'list-disc list-inside mb-4 space-y-2 text-gray-600 ml-4';
  
  let body = '';
  for (let j = 0; j < token.items.length; j++) {
    body += this.listitem(token.items[j]);
  }
  return `<${tag} class="${classes}">${body}</${tag}>`;
};

renderer.listitem = function(item) {
  let itemBody = '';
  
  if (item.task) {
    const checked = item.checked ? ' checked=""' : '';
    itemBody += `<input${checked} disabled="" type="checkbox"> `;
  }
  
  // Handle different item structures
  if (item.tokens && item.tokens.length > 0) {
    try {
      // For list items with a single paragraph token, parse it properly
      if (item.tokens.length === 1 && item.tokens[0].type === 'paragraph') {
        itemBody += this.parser.parseInline(item.tokens[0].tokens);
      } else {
        // For more complex structures, use full parsing
        itemBody += this.parser.parse(item.tokens, false);
      }
    } catch (error) {
      // If inline parsing fails, try manual basic formatting
      const text = item.text || '';
      itemBody += text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-gray-100 text-drizzle-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    }
  } else if (item.text) {
    // Apply basic markdown formatting to text
    const text = item.text;
    itemBody += text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 text-drizzle-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
  }
  
  return `<li class="leading-relaxed">${itemBody}</li>`;
};

// Override code renderers
renderer.code = function(token) {
  const language = token.lang || 'text';
  // Properly escape HTML entities in code blocks
  const escapedText = token.text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return `<pre class="bg-white rounded-lg p-4 overflow-x-auto mb-4 border"><code class="text-xs text-gray-800 language-${language}">${escapedText}</code></pre>`;
};

renderer.codespan = function(token) {
  // Properly escape HTML entities in inline code
  const escapedText = token.text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return `<code class="bg-gray-100 text-drizzle-700 px-2 py-1 rounded text-sm font-mono">${escapedText}</code>`;
};

// Override inline text formatting
renderer.strong = function(token) {
  return `<strong class="font-semibold text-gray-900">${this.parser.parseInline(token.tokens)}</strong>`;
};

renderer.em = function(token) {
  return `<em class="italic">${this.parser.parseInline(token.tokens)}</em>`;
};

// Override blockquote renderer
renderer.blockquote = function(token) {
  return `<blockquote class="border-l-4 border-drizzle-400 pl-4 italic text-gray-600 mb-4 bg-drizzle-50 py-2">${token.text}</blockquote>`;
};

// Override table renderers
renderer.table = function(token) {
  let header = '';
  for (let j = 0; j < token.header.length; j++) {
    header += this.tablecell(token.header[j]);
  }
  header = `<tr>${header}</tr>`;
  
  let body = '';
  for (let j = 0; j < token.rows.length; j++) {
    let row = '';
    for (let k = 0; k < token.rows[j].length; k++) {
      row += this.tablecell(token.rows[j][k]);
    }
    body += `<tr class="border-b border-gray-200">${row}</tr>`;
  }
  
  return `<div class="overflow-x-auto mb-6">
    <table class="min-w-full bg-white border border-gray-200 rounded-lg">
      <thead class="bg-gray-50">${header}</thead>
      <tbody>${body}</tbody>
    </table>
  </div>`;
};

renderer.tablecell = function(token) {
  const tag = token.header ? 'th' : 'td';
  const classes = token.header 
    ? 'px-4 py-3 text-left text-sm font-medium text-gray-700'
    : 'px-4 py-3 text-sm text-gray-600';
  return `<${tag} class="${classes}">${token.text}</${tag}>`;
};

// Override link renderer to handle internal help links
renderer.link = function(token) {
  const linkText = this.parser.parseInline(token.tokens);
  
  if (token.href.startsWith('/help/')) {
    const topic = token.href.replace('/help/', '');
    return `<a href="#" data-help-link="${topic}" class="text-drizzle-600 hover:text-drizzle-700 underline font-medium" ${token.title ? `title="${token.title}"` : ''}>${linkText}</a>`;
  }
  
  const titleAttr = token.title ? ` title="${token.title}"` : '';
  return `<a href="${token.href}" class="text-drizzle-600 hover:text-drizzle-700 underline font-medium" target="_blank" rel="noopener noreferrer"${titleAttr}>${linkText}</a>`;
};

// Override image renderer
renderer.image = function(token) {
  const titleAttr = token.title ? ` title="${token.title}"` : '';
  const altAttr = token.text ? ` alt="${token.text}"` : '';
  return `<img src="${token.href}" class="max-w-full h-auto rounded-lg shadow-md mb-4"${altAttr}${titleAttr} />`;
};

// Override strong (bold) renderer
renderer.strong = function(token) {
  return `<strong class="font-semibold text-slate-700">${this.parser.parseInline(token.tokens)}</strong>`;
};

// Override em (italic) renderer
renderer.em = function(token) {
  return `<em class="italic text-gray-700">${this.parser.parseInline(token.tokens)}</em>`;
};

// Configure marked
marked.use({
  renderer: renderer,
  gfm: true,
  breaks: false,
  pedantic: false,
  smartLists: true,
  smartypants: false
});

// Recursively scan directory for markdown files
function scanDirectory(dir, basePath = '') {
  const items = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? path.join(basePath, entry.name) : entry.name;
    
    if (entry.isDirectory()) {
      items.push(...scanDirectory(fullPath, relativePath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const topicPath = relativePath.replace(/\.md$/, '').replace(/\/index$/, '');
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Extract title from first H1 or use filename
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : path.basename(entry.name, '.md');
      
      // Process markdown to HTML
      const html = marked(content);
      
      items.push({
        slug: topicPath || 'index',
        title: title,
        content: html,
        path: relativePath
      });
    }
  }
  
  return items;
}

// Main build function
function buildHelpContent() {
  console.log('Building help content...');
  
  if (!fs.existsSync(contentDir)) {
    console.error(`Content directory not found: ${contentDir}`);
    process.exit(1);
  }
  
  const helpItems = scanDirectory(contentDir);
  
  if (helpItems.length === 0) {
    console.warn('No help content found');
    return;
  }
  
  // Sort items by slug for consistent ordering
  helpItems.sort((a, b) => a.slug.localeCompare(b.slug));
  
  // Generate TypeScript content
  const tsContent = `// Auto-generated help content - do not edit manually
// Generated on ${new Date().toISOString()}

export interface HelpTopic {
  slug: string;
  title: string;
  content: string;
  path: string;
}

export const helpContent: HelpTopic[] = ${JSON.stringify(helpItems, null, 2)};

export const helpContentMap: Record<string, HelpTopic> = {
${helpItems.map(item => `  '${item.slug}': ${JSON.stringify(item)}`).join(',\n')}
};

// Export for search functionality
export const searchableContent = helpContent.map(item => ({
  slug: item.slug,
  title: item.title,
  content: item.content.replace(/<[^>]*>/g, ' ').replace(/\\s+/g, ' ').trim()
}));
`;
  
  // Write the TypeScript file
  fs.writeFileSync(outputFile, tsContent, 'utf-8');
  
  // Generate sitemap with home page
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.drizzle-cube.dev/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.drizzle-cube.dev/help</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${helpItems.map(item => `  <url>
    <loc>https://www.drizzle-cube.dev/help/${item.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;
  
  // Ensure public directory exists
  const publicDir = path.dirname(sitemapFile);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(sitemapFile, sitemapContent, 'utf-8');
  
  console.log(`✅ Generated help content: ${helpItems.length} topics`);
  console.log(`📝 Output: ${outputFile}`);
  console.log(`🗺️  Sitemap: ${sitemapFile}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildHelpContent();
}

export { buildHelpContent };