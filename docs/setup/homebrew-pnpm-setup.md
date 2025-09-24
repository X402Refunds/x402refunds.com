# Homebrew PNPM Setup Guide

This guide provides comprehensive instructions for setting up and maintaining Homebrew PNPM for the Consulate project.

## 🎯 Overview

The Consulate project **requires** PNPM to be installed via Homebrew to ensure consistency and avoid conflicts. This guide covers installation, verification, troubleshooting, and maintenance.

## 📋 Requirements

- **macOS** with Homebrew installed
- **No existing PNPM installations** from npm, yarn, or other sources
- **Administrative access** for Homebrew operations

## 🍺 Installation

### Step 1: Install Homebrew (if not already installed)

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add Homebrew to your PATH (Apple Silicon Macs)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Add Homebrew to your PATH (Intel Macs)
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/usr/local/bin/brew shellenv)"
```

### Step 2: Install PNPM via Homebrew

```bash
# Install PNPM
brew install pnpm

# Update PNPM to latest version
brew upgrade pnpm
```

### Step 3: Verify Installation

```bash
# Check PNPM location (CRITICAL)
which pnpm
# Expected output (Apple Silicon): /opt/homebrew/bin/pnpm
# Expected output (Intel Mac): /usr/local/bin/pnpm

# Check PNPM version
pnpm --version

# Run project verification script
cd /path/to/consulate
./scripts/verify-homebrew-pnpm.sh
```

## ✅ Verification Commands

### Quick Verification

```bash
# Essential check - PNPM source
which pnpm

# Should output one of:
# /opt/homebrew/bin/pnpm (Apple Silicon)
# /usr/local/bin/pnpm (Intel)
```

### Comprehensive Verification

```bash
# Run the project's verification script
./scripts/verify-homebrew-pnpm.sh

# Or use the package.json script
pnpm verify-pnpm
```

### Manual Verification Steps

```bash
# 1. Check PNPM location
which pnpm

# 2. Check PNPM version (should be >=8.0.0)
pnpm --version

# 3. Check for npm-installed conflicts
npm list -g pnpm 2>/dev/null || echo "No npm conflicts"

# 4. Test basic functionality
pnpm --help
```

## 🧹 Removing Conflicting Installations

### Remove npm-installed PNPM

```bash
# Check if PNPM is installed via npm
npm list -g pnpm

# Remove if found
npm uninstall -g pnpm

# Verify removal
npm list -g pnpm
```

### Remove Yarn-installed PNPM

```bash
# Check if PNPM is installed via yarn
yarn global list | grep pnpm

# Remove if found
yarn global remove pnpm

# Verify removal
yarn global list | grep pnpm || echo "PNPM removed from yarn"
```

### Clean Local PNPM Data

```bash
# Remove local PNPM data directories
rm -rf ~/.local/share/pnpm
rm -rf ~/.pnpm-state
rm -rf ~/.pnpm

# Remove any cached data
rm -rf ~/Library/Caches/pnpm
```

### Remove Project node_modules

```bash
# In the project directory
rm -rf node_modules
rm -f pnpm-lock.yaml

# Reinstall with Homebrew PNPM
pnpm install
```

## 🔧 Troubleshooting

### PNPM Not Found

**Problem**: `command not found: pnpm`

**Solution**:
```bash
# Install PNPM via Homebrew
brew install pnpm

# Ensure Homebrew is in PATH
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
source ~/.zprofile
```

### Wrong PNPM Location

**Problem**: `which pnpm` shows non-Homebrew path

**Solutions**:
```bash
# Remove conflicting installations
npm uninstall -g pnpm
yarn global remove pnpm

# Reinstall via Homebrew
brew uninstall pnpm
brew install pnpm

# Update PATH
source ~/.zprofile
```

### Permission Errors

**Problem**: Permission denied errors when running PNPM

**Solutions**:
```bash
# Fix Homebrew permissions
brew doctor
brew update

# Reinstall PNPM
brew reinstall pnpm

# Check file permissions
ls -la $(which pnpm)
```

### Version Conflicts

**Problem**: PNPM version is too old or incompatible

**Solution**:
```bash
# Update Homebrew
brew update

# Upgrade PNPM
brew upgrade pnpm

# Verify version
pnpm --version
```

### Workspace Issues

**Problem**: Workspace commands fail or behave unexpectedly

**Solutions**:
```bash
# Verify .npmrc configuration
cat .npmrc

# Clean and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Run verification script
./scripts/verify-homebrew-pnpm.sh
```

## 🛠️ Development Tool Integration

### Cursor IDE

Cursor should automatically detect and use the Homebrew PNPM installation. If issues occur:

```bash
# In Cursor, run:
pnpm verify-pnpm

# Check PATH in integrated terminal:
echo $PATH | grep homebrew
```

### VS Code

Configure VS Code to use Homebrew PNPM:

1. Open VS Code settings (`Cmd+,`)
2. Search for "pnpm"
3. Set the PNPM path to `/opt/homebrew/bin/pnpm`

Or add to `settings.json`:
```json
{
  "pnpm.path": "/opt/homebrew/bin/pnpm"
}
```

### Terminal Configuration

Add to your shell configuration file (`.zshrc`, `.bashrc`, etc.):

```bash
# Ensure Homebrew PNPM is prioritized
export PATH="/opt/homebrew/bin:$PATH"

# Alias for verification (optional)
alias verify-pnpm="./scripts/verify-homebrew-pnpm.sh"
```

## 📝 Best Practices

### Daily Development

```bash
# Before starting work, verify setup
pnpm verify-pnpm

# Install dependencies
pnpm install

# Start development
pnpm dev
```

### Before Commits

```bash
# Run full verification
./scripts/verify-homebrew-pnpm.sh

# Ensure tests pass
pnpm test

# Verify build works
pnpm build
```

### Regular Maintenance

```bash
# Weekly: Update Homebrew and PNPM
brew update
brew upgrade pnpm

# Monthly: Clean cache
pnpm store prune
```

## 🚨 Common Pitfalls

### ❌ Don't Do This

```bash
# DON'T install via npm
npm install -g pnpm

# DON'T use npx for pnpm
npx pnpm install

# DON'T mix package managers
npm install && pnpm dev

# DON'T ignore verification failures
# Always fix issues before proceeding
```

### ✅ Do This

```bash
# DO install via Homebrew
brew install pnpm

# DO use pnpm dlx instead of npx
pnpm dlx create-react-app my-app

# DO verify before each session
pnpm verify-pnpm

# DO clean install after conflicts
rm -rf node_modules && pnpm install
```

## 📊 Configuration Files

### .npmrc

The project includes a `.npmrc` file that enforces Homebrew PNPM usage:

```ini
# Key settings for Homebrew PNPM
global-bin-dir=/opt/homebrew/bin
engine-strict=true
package-manager-strict=true
```

### pnpm-workspace.yaml

The workspace configuration is optimized for Homebrew PNPM:

```yaml
# Homebrew PNPM optimizations
shared-workspace-lockfile: true
prefer-workspace-packages: true
resolution-mode: "highest"
```

### package.json

Key package.json configurations:

```json
{
  "packageManager": "pnpm",
  "engines": {
    "pnpm": ">=8.0.0"
  },
  "scripts": {
    "verify-pnpm": "which pnpm && pnpm --version",
    "preinstall": "only-allow pnpm"
  }
}
```

## 🆘 Getting Help

### Automated Diagnostics

```bash
# Run comprehensive check
./scripts/verify-homebrew-pnpm.sh

# Get detailed output
./scripts/verify-homebrew-pnpm.sh --verbose
```

### Manual Diagnostics

```bash
# System information
brew --version
node --version
pnpm --version
which pnpm

# Project configuration
cat package.json | grep -A5 -B5 pnpm
cat .npmrc
cat pnpm-workspace.yaml
```

### Support Resources

- **Project Issues**: [GitHub Issues](https://github.com/consulate-ai/government/issues)
- **Homebrew Support**: `brew doctor` for Homebrew issues
- **PNPM Documentation**: [pnpm.io](https://pnpm.io/)

## 🎉 Success Indicators

You know everything is working correctly when:

✅ `which pnpm` returns `/opt/homebrew/bin/pnpm`  
✅ `pnpm --version` shows version >=8.0.0  
✅ `./scripts/verify-homebrew-pnpm.sh` passes all checks  
✅ `pnpm install` works without errors  
✅ `pnpm dev` starts the development server successfully  

## 📚 Additional Resources

- [Homebrew Documentation](https://docs.brew.sh/)
- [PNPM Installation Guide](https://pnpm.io/installation)
- [Node.js Version Management](https://pnpm.io/cli/env)
- [Workspace Configuration](https://pnpm.io/workspaces)

---

*Last Updated: September 2025*
*For the latest updates, see the project repository.*
