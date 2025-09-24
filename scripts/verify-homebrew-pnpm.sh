#!/bin/bash

# Homebrew PNPM Verification Script
# =================================
# This script verifies that Homebrew PNPM is properly installed and configured
# for the Consulate project, and checks for conflicting installations.

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Icons
SUCCESS="✅"
ERROR="❌"
WARNING="⚠️"
INFO="ℹ️"

echo -e "${BLUE}🍺 Homebrew PNPM Verification Script${NC}"
echo "======================================"

ERRORS=0
WARNINGS=0

# Function to log success
log_success() {
    echo -e "${GREEN}${SUCCESS} $1${NC}"
}

# Function to log error
log_error() {
    echo -e "${RED}${ERROR} $1${NC}"
    ((ERRORS++))
}

# Function to log warning
log_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
    ((WARNINGS++))
}

# Function to log info
log_info() {
    echo -e "${BLUE}${INFO} $1${NC}"
}

echo
echo "1. Checking PNPM Installation Source..."

# Check if pnpm exists
if ! command -v pnpm &> /dev/null; then
    log_error "PNPM is not installed or not in PATH"
    echo "   → Install with: brew install pnpm"
    exit 1
fi

# Check PNPM location
PNPM_LOCATION=$(which pnpm)
log_info "PNPM found at: $PNPM_LOCATION"

if [[ "$PNPM_LOCATION" == "/opt/homebrew/bin/pnpm" ]]; then
    log_success "PNPM is correctly installed via Homebrew"
elif [[ "$PNPM_LOCATION" == "/usr/local/bin/pnpm" ]]; then
    log_success "PNPM is installed via Homebrew (Intel Mac path)"
else
    log_error "PNPM is NOT installed via Homebrew"
    echo "   Current location: $PNPM_LOCATION"
    echo "   Expected: /opt/homebrew/bin/pnpm (Apple Silicon) or /usr/local/bin/pnpm (Intel)"
    echo "   → Remove non-Homebrew installations and install via: brew install pnpm"
fi

echo
echo "2. Checking PNPM Version..."

PNPM_VERSION=$(pnpm --version 2>/dev/null || echo "unknown")
log_info "PNPM Version: $PNPM_VERSION"

# Check if version is compatible (>=8.0.0)
if [[ "$PNPM_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
    MAJOR_VERSION=$(echo "$PNPM_VERSION" | cut -d. -f1)
    if [[ "$MAJOR_VERSION" -ge 8 ]]; then
        log_success "PNPM version is compatible (>=8.0.0)"
    else
        log_error "PNPM version $PNPM_VERSION is too old (requires >=8.0.0)"
        echo "   → Update with: brew upgrade pnpm"
    fi
else
    log_warning "Could not determine PNPM version format"
fi

echo
echo "3. Checking for Conflicting Installations..."

# Check for npm-installed pnpm
if npm list -g pnpm 2>/dev/null | grep -q pnpm; then
    log_error "PNPM is installed globally via npm (conflict detected)"
    echo "   → Remove with: npm uninstall -g pnpm"
fi

# Check for local pnpm data directory
if [[ -d ~/.local/share/pnpm ]]; then
    log_warning "Local PNPM data directory exists (may cause conflicts)"
    echo "   → Remove with: rm -rf ~/.local/share/pnpm"
fi

# Check for yarn global pnpm
if command -v yarn &> /dev/null; then
    if yarn global list 2>/dev/null | grep -q pnpm; then
        log_error "PNPM is installed globally via Yarn (conflict detected)"
        echo "   → Remove with: yarn global remove pnpm"
    fi
fi

echo
echo "4. Validating .npmrc Configuration..."

if [[ -f .npmrc ]]; then
    log_success ".npmrc file exists"
    
    # Check for key configurations
    if grep -q "global-bin-dir=/opt/homebrew/bin" .npmrc 2>/dev/null; then
        log_success ".npmrc configured for Homebrew PNPM"
    else
        log_warning ".npmrc may not be optimally configured for Homebrew"
    fi
    
    if grep -q "engine-strict=true" .npmrc 2>/dev/null; then
        log_success "Engine strict mode enabled in .npmrc"
    else
        log_warning "Engine strict mode not enabled in .npmrc"
    fi
else
    log_error ".npmrc file not found"
    echo "   → This file should be created to enforce Homebrew PNPM usage"
fi

echo
echo "5. Testing Workspace Functionality..."

# Check package.json exists
if [[ -f package.json ]]; then
    log_success "package.json found"
    
    # Check packageManager field
    if grep -q '"packageManager": "pnpm"' package.json; then
        log_success "package.json uses unpinned PNPM version"
    elif grep -q '"packageManager": "pnpm@' package.json; then
        log_warning "package.json pins specific PNPM version (may conflict)"
        echo "   → Consider changing to: \"packageManager\": \"pnpm\""
    else
        log_warning "package.json does not specify PNPM as package manager"
    fi
else
    log_error "package.json not found"
fi

# Check pnpm-workspace.yaml
if [[ -f pnpm-workspace.yaml ]]; then
    log_success "pnpm-workspace.yaml found"
else
    log_warning "pnpm-workspace.yaml not found (may not be a workspace)"
fi

# Test basic pnpm functionality
if pnpm --version &> /dev/null; then
    log_success "PNPM basic functionality test passed"
else
    log_error "PNPM basic functionality test failed"
fi

echo
echo "6. Summary"
echo "=========="

if [[ $ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
    echo -e "${GREEN}${SUCCESS} All checks passed! Homebrew PNPM is properly configured.${NC}"
    echo
    log_info "You can now run:"
    echo "   pnpm install    # Install dependencies"
    echo "   pnpm dev        # Start development"
    echo "   pnpm test       # Run tests"
    exit 0
elif [[ $ERRORS -eq 0 ]]; then
    echo -e "${YELLOW}${WARNING} $WARNINGS warnings found, but no critical errors.${NC}"
    echo -e "${YELLOW}Consider addressing warnings for optimal performance.${NC}"
    exit 0
else
    echo -e "${RED}${ERROR} $ERRORS critical errors found!${NC}"
    echo
    echo "Required fixes:"
    echo "1. Install PNPM via Homebrew: brew install pnpm"
    echo "2. Remove conflicting installations: npm uninstall -g pnpm"
    echo "3. Clean local PNPM data: rm -rf ~/.local/share/pnpm"
    echo "4. Verify installation: which pnpm"
    echo
    echo "Then re-run this script: ./scripts/verify-homebrew-pnpm.sh"
    exit 1
fi
