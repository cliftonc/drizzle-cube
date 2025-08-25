#!/usr/bin/env node

/**
 * This script adds simple analytics ONLY when deploying to the cloudflare account for the public
 * drizzle-cube.dev websites, please delete if you are using this service for yourself.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const ANALYTICS_SCRIPT = `<script async src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
</body>`;

// Your Cloudflare account identifier - only inject analytics when deploying with this account
const AUTHORIZED_CF_ACCOUNT = '7ce11e2ba4b229c0448bb5519c08e379'; // Replace with your actual Cloudflare account email/identifier

function isAuthorizedDeployment() {
  try {
    // Use wrangler whoami to check Cloudflare authentication
    const whoamiOutput = execSync('wrangler whoami', { encoding: 'utf8', stdio: 'pipe' });
    
    if (!whoamiOutput || whoamiOutput.includes('not authenticated')) {
      console.log('🔍 Not authenticated with Cloudflare - skipping analytics injection');
      return false;
    }

    // Check if the authenticated account matches your account
    if (!whoamiOutput.includes(AUTHORIZED_CF_ACCOUNT)) {
      console.log('🔍 Cloudflare account detected but not authorized - skipping analytics injection');
      console.log(`   Found output: ${whoamiOutput.trim()}`);
      console.log(`   Expected account containing: ${AUTHORIZED_CF_ACCOUNT}`);
      return false;
    }

    console.log(`✅ Authorized Cloudflare account detected: ${whoamiOutput.trim()}`);
    return true;
  } catch (error) {
    console.log('🔍 wrangler not available or error checking account - skipping analytics injection');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

function injectAnalytics(filePath) {
  if (!existsSync(filePath)) {
    console.log(`⚠️  Skipping ${filePath} - file not found`);
    return;
  }

  try {
    let content = readFileSync(filePath, 'utf8');
    
    // Check if analytics script is already present
    if (content.includes('scripts.simpleanalyticscdn.com')) {
      console.log(`✅ Analytics already present in ${filePath}`);
      return;
    }
    
    // Replace closing </body> tag with analytics script + closing </body>
    const updatedContent = content.replace('</body>', ANALYTICS_SCRIPT);
    
    if (updatedContent === content) {
      console.log(`⚠️  No </body> tag found in ${filePath}`);
      return;
    }
    
    writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`✅ Injected analytics into ${filePath}`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log('🔬 Checking deployment environment for analytics injection...\n');

if (!isAuthorizedDeployment()) {
  console.log('🚫 Analytics injection skipped - not an authorized deployment');
  process.exit(0);
}

console.log('✅ Authorized deployment detected - injecting analytics...\n');

injectAnalytics('dist/index.html');

console.log('\n🎉 Analytics injection complete!');