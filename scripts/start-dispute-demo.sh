#!/bin/bash

# AI Vendor Dispute Resolution Demo
# Starts the complete system with continuous disputes and monitoring

set -e

echo "🚀 Starting AI Vendor Dispute Resolution Platform Demo"
echo "====================================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [[ ! -f "convex.json" ]]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Check if Convex is deployed
echo -e "${BLUE}🔍 Checking Convex deployment...${NC}"
if ! pnpm convex dev --once > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Convex not deployed. Deploying now...${NC}"
    pnpm deploy
    echo -e "${GREEN}✅ Convex deployed successfully${NC}"
else
    echo -e "${GREEN}✅ Convex is running${NC}"
fi

echo ""
echo -e "${PURPLE}🎯 DEMO OVERVIEW:${NC}"
echo "   This demo shows automated AI vendor dispute resolution at scale:"
echo "   • 50+ AI vendor agents (Stripe, OpenAI, Anthropic, AWS, etc.)"
echo "   • Continuous SLA breaches and dispute generation"
echo "   • Real-time evidence submission from both sides"
echo "   • Automated court processing and binding resolutions"
echo "   • 10-20 disputes per minute, 2-5 minute resolution time"
echo ""

# Get user preference
echo -e "${YELLOW}Choose demo mode:${NC}"
echo "1. Full Demo (Dispute Engine + Monitor) - Recommended"
echo "2. Dispute Engine Only"
echo "3. Monitor Only"
echo "4. Quick Status Check"
echo ""
read -p "Enter choice (1-4): " CHOICE

case $CHOICE in
    1)
        echo -e "${GREEN}Starting Full Demo...${NC}"
        DEMO_MODE="full"
        ;;
    2)
        echo -e "${GREEN}Starting Dispute Engine Only...${NC}"
        DEMO_MODE="engine"
        ;;
    3)
        echo -e "${GREEN}Starting Monitor Only...${NC}"
        DEMO_MODE="monitor"
        ;;
    4)
        echo -e "${GREEN}Running Status Check...${NC}"
        DEMO_MODE="status"
        ;;
    *)
        echo -e "${GREEN}Defaulting to Full Demo...${NC}"
        DEMO_MODE="full"
        ;;
esac

echo ""

# Create log directory
mkdir -p logs

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down demo processes...${NC}"
    
    # Kill background processes
    if [[ -n $ENGINE_PID ]]; then
        kill $ENGINE_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Dispute engine stopped${NC}"
    fi
    
    if [[ -n $MONITOR_PID ]]; then
        kill $MONITOR_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Monitor stopped${NC}"
    fi
    
    echo -e "${GREEN}✅ Demo shutdown complete${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

case $DEMO_MODE in
    "full")
        echo -e "${BLUE}🚀 Starting Dispute Engine...${NC}"
        node scripts/ai-vendor-dispute-engine.js > logs/dispute-engine.log 2>&1 &
        ENGINE_PID=$!
        
        echo -e "${BLUE}🔍 Starting Monitor...${NC}"
        sleep 3  # Give engine time to start
        node scripts/dispute-monitor.js > logs/monitor.log 2>&1 &
        MONITOR_PID=$!
        
        echo ""
        echo -e "${GREEN}✅ Both processes started!${NC}"
        echo -e "${YELLOW}📋 Real-time logs:${NC}"
        echo "   Engine log: tail -f logs/dispute-engine.log"
        echo "   Monitor log: tail -f logs/monitor.log" 
        echo ""
        echo -e "${PURPLE}🎯 WATCHING LIVE DISPUTE RESOLUTION:${NC}"
        echo "   Press Ctrl+C to stop both processes"
        echo ""
        
        # Show live engine output
        tail -f logs/dispute-engine.log 2>/dev/null || echo "Starting up..."
        ;;
        
    "engine")
        echo -e "${BLUE}🚀 Starting Dispute Engine Only...${NC}"
        node scripts/ai-vendor-dispute-engine.js &
        ENGINE_PID=$!
        
        echo ""
        echo -e "${GREEN}✅ Dispute engine started!${NC}"
        echo -e "${YELLOW}📋 To monitor: node scripts/dispute-monitor.js${NC}"
        echo "   Press Ctrl+C to stop"
        
        wait $ENGINE_PID
        ;;
        
    "monitor")
        echo -e "${BLUE}🔍 Starting Monitor Only...${NC}"
        node scripts/dispute-monitor.js &
        MONITOR_PID=$!
        
        echo ""
        echo -e "${GREEN}✅ Monitor started!${NC}"
        echo -e "${YELLOW}📋 To start disputes: node scripts/ai-vendor-dispute-engine.js${NC}"
        echo "   Press Ctrl+C to stop"
        
        wait $MONITOR_PID
        ;;
        
    "status")
        echo -e "${BLUE}🔍 Checking System Status...${NC}"
        echo ""
        
        # System health
        node scripts/dispute-monitor.js health
        
        echo ""
        
        # Active agents
        node scripts/dispute-monitor.js agents
        
        echo ""
        
        # Active disputes  
        node scripts/dispute-monitor.js disputes
        
        echo ""
        echo -e "${GREEN}✅ Status check complete${NC}"
        echo -e "${YELLOW}💡 To start full demo: ./scripts/start-dispute-demo.sh${NC}"
        ;;
esac
