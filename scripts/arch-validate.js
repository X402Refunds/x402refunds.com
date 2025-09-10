#!/usr/bin/env node

/**
 * Architecture Validation Tool
 * Validates suggestions against current architecture map
 */

import { readFileSync } from 'fs';
import { parse } from 'yaml';

const ARCHITECTURE_MAP = '.architecture/map.yaml';

function loadArchitectureMap() {
  try {
    const content = readFileSync(ARCHITECTURE_MAP, 'utf8');
    return parse(content);
  } catch (error) {
    console.error('❌ Failed to load architecture map:', error.message);
    process.exit(1);
  }
}

function validateSuggestion(suggestion, map) {
  const issues = [];
  const warnings = [];
  const fixes = [];

  // Check for deprecated location patterns
  for (const deprecatedLocation of map.deprecated.locations) {
    if (suggestion.includes(deprecatedLocation)) {
      issues.push({
        type: 'deprecated_location',
        pattern: deprecatedLocation,
        message: `Uses deprecated location: ${deprecatedLocation}`
      });
      
      // Try to suggest a fix
      const currentLocation = findCurrentLocationFor(deprecatedLocation, map);
      if (currentLocation) {
        fixes.push({
          from: deprecatedLocation,
          to: currentLocation,
          suggestion: suggestion.replace(deprecatedLocation, currentLocation)
        });
      }
    }
  }

  // Check for deprecated command patterns
  for (const deprecatedCommand of map.deprecated.commands) {
    if (suggestion.includes(deprecatedCommand)) {
      issues.push({
        type: 'deprecated_command',
        pattern: deprecatedCommand,
        message: `Uses deprecated command: ${deprecatedCommand}`
      });

      // Try to suggest a fix
      const currentCommand = findCurrentCommandFor(deprecatedCommand, map);
      if (currentCommand) {
        fixes.push({
          from: deprecatedCommand,
          to: currentCommand,
          suggestion: suggestion.replace(deprecatedCommand, currentCommand)
        });
      }
    }
  }

  // Check for deprecated patterns
  for (const deprecatedPattern of map.deprecated.patterns) {
    if (suggestion.includes(deprecatedPattern)) {
      issues.push({
        type: 'deprecated_pattern',
        pattern: deprecatedPattern,
        message: `Uses deprecated pattern: ${deprecatedPattern}`
      });
    }
  }

  // Check against architecture principles
  const principleViolations = checkPrinciples(suggestion, map.principles);
  issues.push(...principleViolations);

  return {
    valid: issues.length === 0,
    suggestion,
    issues,
    warnings,
    fixes,
    score: calculateValidityScore(issues, warnings)
  };
}

function findCurrentLocationFor(deprecatedLocation, map) {
  // Map deprecated locations to current ones
  const locationMap = {
    'convex/': map.current.locations.backend,
    './': map.current.locations.root_config,
    'packages/': null // No replacement - packages were removed
  };
  
  return locationMap[deprecatedLocation] || null;
}

function findCurrentCommandFor(deprecatedCommand, map) {
  // Map deprecated commands to current ones
  const commandMap = {
    'pnpm dev': map.current.commands.dev,
    'pnpm deploy': map.current.commands.deploy,
    'convex deploy': map.current.commands.convex_deploy
  };
  
  return commandMap[deprecatedCommand] || null;
}

function checkPrinciples(suggestion, principles) {
  const violations = [];
  
  // Check for microservice patterns (violates "No external services")
  if (suggestion.includes('docker-compose') || suggestion.includes('microservice')) {
    violations.push({
      type: 'principle_violation',
      principle: 'No external services or complex infrastructure',
      message: 'Suggestion involves external services or complex infrastructure'
    });
  }
  
  // Check for build complexity (violates "Zero build complexity")
  if (suggestion.includes('webpack') || suggestion.includes('rollup') || suggestion.includes('build script')) {
    violations.push({
      type: 'principle_violation', 
      principle: 'Zero build complexity',
      message: 'Suggestion adds unnecessary build complexity'
    });
  }
  
  return violations;
}

function calculateValidityScore(issues, warnings) {
  const issueWeight = 10;
  const warningWeight = 2;
  
  const totalDeductions = (issues.length * issueWeight) + (warnings.length * warningWeight);
  return Math.max(0, 100 - totalDeductions);
}

function formatValidationResult(result) {
  if (result.valid) {
    return `✅ VALID (Score: ${result.score}/100)
Suggestion follows current architecture patterns.

${result.suggestion}`;
  }

  let output = `❌ INVALID (Score: ${result.score}/100)
The following issues were found:

`;

  for (const issue of result.issues) {
    output += `🚨 ${issue.type.toUpperCase()}: ${issue.message}\n`;
    if (issue.pattern) {
      output += `   Pattern: "${issue.pattern}"\n`;
    }
  }

  if (result.fixes.length > 0) {
    output += `\n💡 SUGGESTED FIXES:\n`;
    for (const fix of result.fixes) {
      output += `   Replace: "${fix.from}"\n`;
      output += `   With: "${fix.to}"\n`;
      output += `   Result: ${fix.suggestion}\n\n`;
    }
  }

  return output;
}

function main() {
  const suggestion = process.argv[2];
  
  if (!suggestion) {
    console.error('Usage: node scripts/arch-validate.js "<suggestion>"');
    process.exit(1);
  }

  console.log('🔍 Validating suggestion against architecture map...\n');
  
  const map = loadArchitectureMap();
  const result = validateSuggestion(suggestion, map);
  
  console.log(formatValidationResult(result));
  
  // Exit with appropriate code
  process.exit(result.valid ? 0 : 1);
}

// Support both ES modules and CommonJS
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateSuggestion, loadArchitectureMap };
