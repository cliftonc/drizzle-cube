import { marked } from 'marked';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentDir = path.join(__dirname, '../content');
const configFile = path.join(__dirname, '../help-content-config.json');
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
        .replace(/`(.*?)`/g, (match, code) => {
          // Handle arrow functions specially in list item code spans
          let escapedCode = code;
          
          // Handle arrow functions first (before any encoding)
          escapedCode = escapedCode.replace(/=>/g, '__ARROW_FUNCTION__');
          
          // Now escape HTML entities
          escapedCode = escapedCode
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
            
          // Restore arrow functions after escaping
          escapedCode = escapedCode.replace(/__ARROW_FUNCTION__/g, '=>');
          
          return `<code class="bg-gray-100 text-drizzle-700 px-2 py-1 rounded-sm text-sm font-mono">${escapedCode}</code>`;
        });
    }
  } else if (item.text) {
    // Apply basic markdown formatting to text
    const text = item.text;
    itemBody += text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, (match, code) => {
        // Handle arrow functions specially in list item code spans
        let escapedCode = code;
        
        // Handle arrow functions first (before any encoding)
        escapedCode = escapedCode.replace(/=>/g, '__ARROW_FUNCTION__');
        
        // Now escape HTML entities
        escapedCode = escapedCode
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
          
        // Restore arrow functions after escaping
        escapedCode = escapedCode.replace(/__ARROW_FUNCTION__/g, '=>');
        
        return `<code class="bg-gray-100 text-drizzle-700 px-2 py-1 rounded-sm text-sm font-mono">${escapedCode}</code>`;
      });
  }
  
  return `<li class="leading-relaxed">${itemBody}</li>`;
};

// Override code renderers
renderer.code = function(token) {
  const rawLanguage = token.lang || 'text';
  // Map common language aliases to their proper Prism.js names
  const languageMap = {
    'ts': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'tsx': 'typescript',
    'sh': 'bash',
    'shell': 'bash',
    'yml': 'yaml',
    'dockerfile': 'docker'
  };
  const language = languageMap[rawLanguage] || rawLanguage;
  // Properly escape HTML entities in code blocks
  const escapedText = token.text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return `<div class="relative group">
    <pre class="language-${language} rounded-lg overflow-x-auto mb-4"><code class="language-${language}">${escapedText}</code></pre>
    <button class="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 copy-code-btn" data-code="${escapedText.replace(/"/g, '&quot;')}" title="Copy to clipboard">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    </button>
  </div>`;
};

renderer.codespan = function(token) {
  // For inline code spans, escape all HTML entities but handle arrow functions specially
  let text = token.text;
  
  // Handle arrow functions first (before any encoding)
  text = text.replace(/=>/g, '__ARROW_FUNCTION__');
  
  // Now escape HTML entities
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
    
  // Restore arrow functions after escaping
  text = text.replace(/__ARROW_FUNCTION__/g, '=>');
  
  return `<code class="bg-gray-100 text-drizzle-700 px-2 py-1 rounded-sm text-sm font-mono">${text}</code>`;
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

// Load external includes from configuration
function loadExternalIncludes() {
  const externalItems = [];
  
  if (fs.existsSync(configFile)) {
    try {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
      
      if (config.externalIncludes) {
        for (const [slug, includeConfig] of Object.entries(config.externalIncludes)) {
          const sourcePath = path.resolve(__dirname, '..', includeConfig.source);
          
          if (fs.existsSync(sourcePath)) {
            const content = fs.readFileSync(sourcePath, 'utf-8');
            
            // Extract title from first H1 or use configured title
            const titleMatch = content.match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1] : includeConfig.title;
            
            // Process markdown to HTML
            const html = marked(content);
            
            externalItems.push({
              slug: slug,
              title: title,
              content: html,
              path: `external:${includeConfig.source}`
            });
            
            console.log(`✅ Included external file: ${sourcePath} as ${slug}`);
          } else {
            console.warn(`⚠️  External file not found: ${sourcePath}`);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Error loading config file: ${error.message}`);
    }
  }
  
  return externalItems;
}

// Main build function
function buildHelpContent() {
  console.log('Building help content...');
  
  if (!fs.existsSync(contentDir)) {
    console.error(`Content directory not found: ${contentDir}`);
    process.exit(1);
  }
  
  const helpItems = scanDirectory(contentDir);
  const externalItems = loadExternalIncludes();
  
  // Combine local and external content
  const allItems = [...helpItems, ...externalItems];
  
  if (allItems.length === 0) {
    console.warn('No help content found');
    return;
  }
  
  // Sort items by slug for consistent ordering
  allItems.sort((a, b) => a.slug.localeCompare(b.slug));
  
  // Generate TypeScript content
  const tsContent = `// Auto-generated help content - do not edit manually

export interface HelpTopic {
  slug: string;
  title: string;
  content: string;
  path: string;
}

export const helpContent: HelpTopic[] = ${JSON.stringify(allItems, null, 2)};

export const helpContentMap: Record<string, HelpTopic> = {
${allItems.map(item => `  '${item.slug}': ${JSON.stringify(item)}`).join(',\n')}
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
${allItems.map(item => `  <url>
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
  
  console.log(`✅ Generated help content: ${allItems.length} topics (${helpItems.length} local + ${externalItems.length} external)`);
  console.log(`📝 Output: ${outputFile}`);
  console.log(`🗺️  Sitemap: ${sitemapFile}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildHelpContent();
}

export { buildHelpContent };