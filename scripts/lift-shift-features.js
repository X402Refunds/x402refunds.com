#!/usr/bin/env node
// Script to lift and shift features content from /features page to index page

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dashboard/src/app/page.tsx');
const featuresPath = path.join(__dirname, '../dashboard/src/app/features/page.tsx');

// Read both files
const indexContent = fs.readFileSync(indexPath, 'utf8');
const featuresContent = fs.readFileSync(featuresPath, 'utf8');

// Extract the Core Features Section from features page (lines 71-353)
const featuresMatch = featuresContent.match(
  /\/\* Core Features Section \*\/[\s\S]*?<\/section>\s+<\/section>\s+<\/section>/
);

if (!featuresMatch) {
  console.error('Could not find Core Features Section in features page');
  process.exit(1);
}

const coreFeatures = `      {/* Core Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-20">` + 
  featuresContent.substring(
    featuresContent.indexOf('{/* Feature 1: Persistent Identity */}'),
    featuresContent.indexOf('{/* Benefits Grid */}') - 1
  ).trim() + `
          </div>
        </div>
      </section>

`;

// Extract Benefits Grid from features page (lines 356-409)
const benefitsGrid = `      {/* Benefits Grid */}
` + featuresContent.substring(
  featuresContent.indexOf('{/* Benefits Grid */}'),
  featuresContent.indexOf('{/* CTA Section */}') - 1
).trim() + `

`;

// Remove Value Proposition section from index and insert features content
const valuePropStart = indexContent.indexOf('{/* Value Proposition */}');
const valuePropEnd = indexContent.indexOf('{/* Demo Cases */}');

if (valuePropStart === -1 || valuePropEnd === -1) {
  console.error('Could not find Value Proposition section in index page');
  process.exit(1);
}

// Construct new index content
const newIndexContent = 
  indexContent.substring(0, valuePropStart) +
  coreFeatures +
  benefitsGrid +
  indexContent.substring(valuePropEnd);

// Write updated index file
fs.writeFileSync(indexPath, newIndexContent, 'utf8');

console.log('✅ Successfully lifted and shifted features content to index page');
console.log('   - Added Core Features Section');
console.log('   - Added Benefits Grid');
console.log('   - Removed Value Proposition section');

