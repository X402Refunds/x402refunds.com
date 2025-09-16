#!/usr/bin/env node

/**
 * VIEW CONSTITUTION - File-based Constitution Viewer
 * Shows the complete constitution in a readable format
 */

import fs from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  title: '\x1b[1m\x1b[36m',    // Cyan bold
  section: '\x1b[1m\x1b[33m',  // Yellow bold  
  subsection: '\x1b[1m\x1b[35m', // Magenta bold
  text: '\x1b[0m',             // Reset
  highlight: '\x1b[32m',       // Green
  error: '\x1b[31m'            // Red
};

function colorize(text, color) {
  return `${color}${text}${colors.text}`;
}

async function viewConstitution() {
  console.log(colorize('\n🏛️  LUCIAN AI CONSTITUTION VIEWER', colors.title));
  console.log(colorize('=====================================\n', colors.title));

  const constitutionPath = path.join(process.cwd(), 'CONSTITUTION.md');
  const humanOversightPath = path.join(process.cwd(), 'HUMAN_OVERSIGHT.md');  
  const statusPath = path.join(process.cwd(), 'CONSTITUTIONAL_DEMOCRACY_STATUS.md');

  try {
    // Check which constitution files exist
    const files = [
      { name: 'Main Constitution', path: constitutionPath, exists: fs.existsSync(constitutionPath) },
      { name: 'Human Oversight', path: humanOversightPath, exists: fs.existsSync(humanOversightPath) },
      { name: 'Democracy Status', path: statusPath, exists: fs.existsSync(statusPath) }
    ];

    console.log(colorize('📁 Constitution Files:', colors.section));
    files.forEach(file => {
      const status = file.exists ? colorize('✅ EXISTS', colors.highlight) : colorize('❌ MISSING', colors.error);
      const size = file.exists ? ` (${Math.round(fs.statSync(file.path).size / 1024)}KB)` : '';
      console.log(`   ${file.name}: ${status}${size}`);
    });

    // Read and display main constitution
    if (fs.existsSync(constitutionPath)) {
      console.log(colorize('\n📜 MAIN CONSTITUTION PREVIEW:', colors.section));
      console.log(colorize('=====================================\n', colors.section));
      
      const constitution = fs.readFileSync(constitutionPath, 'utf8');
      
      // Extract key information
      const lines = constitution.split('\n');
      const preview = lines.slice(0, 30); // Show first 30 lines
      
      preview.forEach(line => {
        if (line.startsWith('# ')) {
          console.log(colorize(line, colors.title));
        } else if (line.startsWith('## ')) {
          console.log(colorize(line, colors.section));
        } else if (line.startsWith('### ')) {
          console.log(colorize(line, colors.subsection));
        } else {
          console.log(line);
        }
      });

      if (lines.length > 30) {
        console.log(colorize(`\n... [${lines.length - 30} more lines]`, colors.text));
      }

      // Constitution statistics
      console.log(colorize('\n📊 CONSTITUTION STATISTICS:', colors.section));
      console.log(colorize('==============================', colors.section));
      console.log(`📏 Total Length: ${colorize(constitution.length.toLocaleString() + ' characters', colors.highlight)}`);
      console.log(`📄 Total Lines: ${colorize(lines.length.toLocaleString() + ' lines', colors.highlight)}`);
      
      // Count articles
      const articles = constitution.match(/### Article:/g) || [];
      console.log(`📋 Articles: ${colorize(articles.length + ' ratified articles', colors.highlight)}`);
      
      // Count sections
      const sections = constitution.match(/^## /gm) || [];
      console.log(`🏗️  Sections: ${colorize(sections.length + ' major sections', colors.highlight)}`);

    } else {
      console.log(colorize('\n❌ Main constitution file not found!', colors.error));
      console.log(colorize('Run: node scripts/generate-constitution.js', colors.text));
    }

    console.log(colorize('\n💡 COMMANDS:', colors.section));
    console.log(colorize('============', colors.section));
    console.log(`📖 Read full constitution: ${colorize('cat CONSTITUTION.md', colors.highlight)}`);
    console.log(`🔄 Regenerate constitution: ${colorize('node scripts/generate-constitution.js', colors.highlight)}`);
    console.log(`🗳️  Check democracy status: ${colorize('cat CONSTITUTIONAL_DEMOCRACY_STATUS.md', colors.highlight)}`);
    console.log(`👥 View human oversight: ${colorize('cat HUMAN_OVERSIGHT.md', colors.highlight)}`);

  } catch (error) {
    console.error(colorize(`\n❌ Error reading constitution files: ${error.message}`, colors.error));
    process.exit(1);
  }
}

// Run the viewer
viewConstitution().catch(error => {
  console.error(colorize(`Fatal error: ${error.message}`, colors.error));
  process.exit(1);
});
