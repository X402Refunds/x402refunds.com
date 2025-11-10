/**
 * Generate favicon files from SVG source
 * 
 * This script requires 'sharp' package for PNG generation.
 * Run: pnpm add -D sharp
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateFavicons() {
  try {
    
    const svgPath = path.join(__dirname, '../dashboard/public/x-favicon.svg');
    const outputDir = path.join(__dirname, '../dashboard/public');
    
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Generate different sizes
    const sizes = [
      { size: 32, name: 'favicon-32.png' },
      { size: 192, name: 'favicon-192.png' },
      { size: 512, name: 'favicon-512.png' },
      { size: 180, name: 'apple-touch-icon.png' }
    ];
    
    console.log('🎨 Generating favicon files...\n');
    
    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${name} (${size}x${size})`);
    }
    
    // Generate ICO (use 32x32 PNG and rename)
    const icoPath = path.join(outputDir, 'favicon.ico');
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(icoPath.replace('.ico', '-temp.png'));
    
    // Rename temp PNG to ICO (browsers accept PNG as ICO)
    fs.renameSync(icoPath.replace('.ico', '-temp.png'), icoPath);
    console.log(`✓ Generated favicon.ico (32x32)\n`);
    
    console.log('✨ All favicon files generated successfully!');
    console.log('\nGenerated files:');
    console.log('  - favicon.ico');
    console.log('  - favicon-32.png');
    console.log('  - favicon-192.png');
    console.log('  - favicon-512.png');
    console.log('  - apple-touch-icon.png');
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error.message);
    console.error(error);
    process.exit(1);
  }
}

generateFavicons();

