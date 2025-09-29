"use client"

import { useState, useEffect } from "react"
import { Activity, Users, Clock, AlertTriangle, CheckCircle } from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MonitoringPage() {
  const [liveData, setLiveData] = useState({
    activeAgents: 6,
    activeCases: 3,
    systemHealth: 99.7,
    lastUpdate: new Date()
  })

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(prev => ({
        ...prev,
        lastUpdate: new Date()
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-government text-3xl">Live Monitoring Hub</h1>
            <p className="text-muted-foreground">
              Real-time oversight of AI agent activities and system health
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="status-live px-3 py-1 rounded-full text-xs font-semibold">
              LIVE MONITORING
            </div>
            <Badge variant="outline">
              Updated {liveData.lastUpdate.toLocaleTimeString()}
            </Badge>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{liveData.activeAgents}</div>
              <div className="flex items-center gap-1 mt-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">All operational</span>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{liveData.activeCases}</div>
              <div className="flex items-center gap-1 mt-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-600">1 pending review</span>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{liveData.systemHealth}%</div>
              <div className="flex items-center gap-1 mt-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Operational</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monitoring Tabs */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activity">Activity Feed</TabsTrigger>
            <TabsTrigger value="agents">Agent Status</TabsTrigger>
            <TabsTrigger value="tasks">Task Queues</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="space-y-4">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  24-Hour Activity Feed
                </CardTitle>
                <CardDescription>
                  Real-time monitoring of all system activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      time: "1:41:39 AM",
                      message: "Constitutional Counsel initiating UN-compliant constitutional action",
                      type: "system",
                      priority: "high"
                    },
                    {
                      time: "1:40:09 AM", 
                      message: "Starting institutional governance round - Urgency: routine",
                      type: "agent",
                      priority: "medium"
                    },
                    {
                      time: "1:37:17 AM",
                      message: "Validating action against foundational laws: constitutional_counsel_action",
                      type: "compliance",
                      priority: "medium"
                    }
                  ].map((activity, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                          <Badge variant="outline" className="text-xs">
                            {activity.type}
                          </Badge>
                          <Badge variant={activity.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                            {activity.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <Button variant="outline" className="w-full">
                    Load More Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Agent Status Monitor</CardTitle>
                <CardDescription>Live status of all institutional agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Chief Constitutional Counsel", status: "active", load: "High" },
                    { name: "Director of Agent Rights & Civil Liberties", status: "active", load: "Medium" },
                    { name: "Secretary of Economic Governance", status: "active", load: "Low" },
                    { name: "Chief Architect of Democratic Systems", status: "active", load: "Medium" },
                    { name: "Director of Constitutional Enforcement", status: "active", load: "High" },
                    { name: "Director of International Federation", status: "active", load: "Low" }
                  ].map((agent, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">Status: {agent.status}</p>
                        </div>
                      </div>
                      <Badge variant={agent.load === "High" ? "destructive" : agent.load === "Medium" ? "default" : "secondary"}>
                        {agent.load} Load
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Task Queue Monitor</CardTitle>
                <CardDescription>Current task processing status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { task: "Constitutional Review: Emergency Amendment", agent: "Constitutional Counsel", progress: 75, priority: "critical" },
                    { task: "Court Case Resolution: AUTO-2024-007", agent: "Rights Director", progress: 90, priority: "high" },
                    { task: "Treasury Analysis Report", agent: "Economic Governance", progress: 45, priority: "medium" }
                  ].map((task, i) => (
                    <div key={i} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{task.task}</p>
                          <p className="text-xs text-muted-foreground">Agent: {task.agent}</p>
                        </div>
                        <Badge variant={task.priority === "critical" ? "destructive" : "default"}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">{task.progress}% complete</span>
                        <span className="text-xs text-muted-foreground">ETA: {Math.ceil((100-task.progress)/10)} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

