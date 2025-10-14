// Get the Convex deployment URL from Next.js environment variables
// NEXT_PUBLIC_ prefixed variables are automatically available in the browser
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://perceptive-lyrebird-89.convex.cloud';

// Note: We're not using ConvexHttpClient since we're accessing HTTP endpoints directly
// ConvexHttpClient is for database queries, but we're accessing dashboard HTTP routes

// Dashboard endpoints mapping
export const DASHBOARD_ENDPOINTS = {
  // Real-time monitoring endpoints
  monitoring: "/demo/monitoring",
  override: "/demo/override", 
  tasks: "/demo/tasks",
  discussions: "/demo/discussions",
  emergency: "/demo/emergency",
  
  // Legacy dashboard
  legacy: "/demo/legacy",
  
  // Data endpoints (we'll create these)
  activityFeed: "/api/activity-feed",
  agentStatus: "/api/agent-status",
  systemHealth: "/api/system-health"
}

// Fetch functions for dashboard data
export async function fetchActivityFeed() {
  try {
    const response = await fetch(`${CONVEX_URL}/api/activity-feed`)
    if (!response.ok) throw new Error('Failed to fetch activity feed')
    return await response.json()
  } catch (error) {
    console.error('Error fetching activity feed:', error)
    return { activities: [], error: 'Failed to load activity feed' }
  }
}

export async function fetchAgentStatus() {
  try {
    const response = await fetch(`${CONVEX_URL}/api/agent-status`)
    if (!response.ok) throw new Error('Failed to fetch agent status')
    return await response.json()
  } catch (error) {
    console.error('Error fetching agent status:', error)
    return { agents: [], error: 'Failed to load agent status' }
  }
}

export async function fetchSystemHealth() {
  try {
    const response = await fetch(`${CONVEX_URL}/api/system-health`)
    if (!response.ok) throw new Error('Failed to fetch system health')
    return await response.json()
  } catch (error) {
    console.error('Error fetching system health:', error)
    return { health: { uptime: 0, responseTime: 0, activeAgents: 0 }, error: 'Failed to load system health' }
  }
}

export async function fetchConstitutionalDiscussions() {
  try {
    const response = await fetch(`${CONVEX_URL}/api/constitutional-discussions`)
    if (!response.ok) throw new Error('Failed to fetch discussions')
    return await response.json()
  } catch (error) {
    console.error('Error fetching constitutional discussions:', error)
    return { discussions: [], error: 'Failed to load discussions' }
  }
}

// Real-time iframe integration for existing dashboards
export function createDashboardIframe(endpoint: string): string {
  return `${CONVEX_URL}${endpoint}`
}

// Integration utilities
export const DashboardIntegration = {
  // Check if the original dashboard endpoints are accessible
  async checkEndpointHealth(endpoint: string): Promise<boolean> {
    try {
      const response = await fetch(`${CONVEX_URL}${endpoint}`, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  },
  
  // Get all available dashboard endpoints
  async getAvailableEndpoints(): Promise<string[]> {
    const endpoints = Object.values(DASHBOARD_ENDPOINTS)
    const available = []
    
    for (const endpoint of endpoints) {
      if (await this.checkEndpointHealth(endpoint)) {
        available.push(endpoint)
      }
    }
    
    return available
  }
}
