import { watch } from 'chokidar';
import { buildHelpContent } from './build-help-content.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentDir = path.join(__dirname, '../content');

console.log('👀 Watching help content directory for changes...');
console.log(`📁 Watching: ${contentDir}`);

// Initial build
buildHelpContent();

// Watch for changes
const watcher = watch(contentDir, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true
});

watcher
  .on('add', (filePath) => {
    console.log(`➕ File added: ${path.relative(contentDir, filePath)}`);
    buildHelpContent();
  })
  .on('change', (filePath) => {
    console.log(`🔄 File changed: ${path.relative(contentDir, filePath)}`);
    buildHelpContent();
  })
  .on('unlink', (filePath) => {
    console.log(`➖ File removed: ${path.relative(contentDir, filePath)}`);
    buildHelpContent();
  })
  .on('error', (error) => {
    console.error('❌ Watch error:', error);
  });

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down help content watcher...');
  watcher.close();
  process.exit(0);
});