"use client"

import { useState, useEffect } from "react"
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createDashboardIframe, DashboardIntegration } from "@/lib/convex"

interface EmbeddedDashboardProps {
  endpoint: string
  title: string
  description?: string
  height?: number
  showNativeVersion?: boolean
  className?: string
}

export function EmbeddedDashboard({
  endpoint,
  title,
  description,
  height = 600,
  showNativeVersion = false,
  className
}: EmbeddedDashboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAvailable, setIsAvailable] = useState(false)
  const [showIframe, setShowIframe] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkEndpointAvailability()
  }, [endpoint])

  const checkEndpointAvailability = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const available = await DashboardIntegration.checkEndpointHealth(endpoint)
      setIsAvailable(available)
      
      if (!available) {
        setError(`Dashboard endpoint ${endpoint} is not accessible`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setIsAvailable(false)
    } finally {
      setIsLoading(false)
    }
  }

  const dashboardUrl = createDashboardIframe(endpoint)

  if (isLoading) {
    return (
      <Card className={`dashboard-card ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading {title}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Checking dashboard availability...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !isAvailable) {
    return (
      <Card className={`dashboard-card ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {title} - Unavailable
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Dashboard endpoint is not accessible'}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={checkEndpointAvailability} 
            variant="outline" 
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`dashboard-card ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            <Badge className="status-live">LIVE</Badge>
            {showNativeVersion && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowIframe(!showIframe)}
              >
                {showIframe ? "Native View" : "Live Dashboard"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a 
                href={dashboardUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Open
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {showIframe ? (
          <iframe
            src={dashboardUrl}
            width="100%"
            height={height}
            className="border-0 rounded-b-lg"
            title={`${title} Dashboard`}
            sandbox="allow-same-origin allow-scripts allow-forms"
            loading="lazy"
          />
        ) : (
          <div className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Native dashboard view coming soon. For now, use the live dashboard link above.
            </p>
            <Button onClick={() => setShowIframe(true)}>
              Show Live Dashboard
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Quick access component for all dashboards
export function DashboardQuickAccess() {
  const dashboards = [
    {
      endpoint: "/dashboard/monitoring",
      title: "Real-Time Monitoring",
      description: "Live activity and system health",
      badge: "LIVE"
    },
    {
      endpoint: "/dashboard/override",
      title: "Human Override Control",
      description: "Emergency controls and oversight",
      badge: "SECURE"
    },
    {
      endpoint: "/dashboard/tasks",
      title: "Task Management",
      description: "Agent task queues and progress",
      badge: "ACTIVE"
    },
    {
      endpoint: "/dashboard/discussions",
      title: "Constitutional Monitor",
      description: "Live constitutional discussions",
      badge: "PENDING"
    },
    {
      endpoint: "/dashboard/emergency",
      title: "Emergency Operations",
      description: "DEFCON threat monitoring",
      badge: "DEFCON 5"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {dashboards.map((dashboard) => (
        <Card key={dashboard.endpoint} className="dashboard-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{dashboard.title}</CardTitle>
              <Badge variant="secondary">{dashboard.badge}</Badge>
            </div>
            <CardDescription className="text-sm">{dashboard.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              asChild
            >
              <a 
                href={createDashboardIframe(dashboard.endpoint)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-3 w-3" />
                Open Dashboard
              </a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

