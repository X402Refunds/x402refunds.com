"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import LiveDisputeMonitor from "@/components/dashboard/live-dispute-monitor"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle } from "lucide-react"

export default function DashboardPage() {
  const [demoRunning, setDemoRunning] = useState(false)
  const [demoStats, setDemoStats] = useState({
    total: 0,
    autoResolved: 0,
    needsReview: 0,
  })
  
  const receiveDispute = useMutation(api.paymentDisputes.receivePaymentDispute)
  
  const runMicroDisputeDemo = async () => {
    setDemoRunning(true)
    setDemoStats({ total: 0, autoResolved: 0, needsReview: 0 })
    
    const microAmounts = [0.02, 0.05, 0.10, 0.15, 0.25, 0.35, 0.50, 0.75, 0.95]
    const reasons = ["api_timeout", "service_not_rendered", "quality_issue", "amount_incorrect", "rate_limit_breach"] as const
    
    try {
      for (let i = 0; i < 100; i++) {
        const amount = microAmounts[Math.floor(Math.random() * microAmounts.length)]
        const reason = reasons[Math.floor(Math.random() * reasons.length)]
        
        const result = await receiveDispute({
          transactionId: `demo_txn_${Date.now()}_${i}`,
          transactionHash: `0x${Math.random().toString(36).substring(2, 15)}`,
          amount,
          currency: "USD",
          paymentProtocol: Math.random() > 0.5 ? "ACP" : "ATXP",
          plaintiff: `customer_wallet_${i}`,
          defendant: `merchant_agent_${i % 5}`, // 5 different merchants
          disputeReason: reason,
          description: `Demo micro-dispute: ${reason}`,
          evidenceUrls: [`https://evidence.example.com/demo_${i}.json`],
        })
        
        setDemoStats(prev => ({
          total: prev.total + 1,
          autoResolved: prev.autoResolved + (result.humanReviewRequired ? 0 : 1),
          needsReview: prev.needsReview + (result.humanReviewRequired ? 1 : 0),
        }))
        
        // Visual delay
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    } catch (error) {
      console.error("Demo failed:", error)
      alert("Demo failed. Check console for details.")
    } finally {
      setDemoRunning(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Infrastructure Model Demo */}
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
          <CardHeader>
            <CardTitle className="text-2xl">Infrastructure Model: 95% Automation Demo</CardTitle>
            <CardDescription className="text-gray-700 dark:text-gray-300">
              Watch Consulate process 100 micro-disputes in real-time. 95% auto-resolved, 5% routed to your review queue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {demoStats.total}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Total Processed
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-green-200 dark:border-green-800 text-center">
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {demoStats.autoResolved}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Auto-Resolved by AI
                </div>
                {demoStats.total > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {((demoStats.autoResolved / demoStats.total) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
              
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 text-center">
                <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                  {demoStats.needsReview}
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Needs Your Review
                </div>
                {demoStats.total > 0 && (
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    {((demoStats.needsReview / demoStats.total) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress */}
            {demoRunning && (
              <div>
                <Progress value={(demoStats.total / 100) * 100} className="h-2" />
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-2">
                  Processing dispute {demoStats.total}/100...
                </p>
              </div>
            )}
            
            {/* Demo Button */}
            <Button
              onClick={runMicroDisputeDemo}
              disabled={demoRunning}
              size="lg"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {demoRunning ? "Processing disputes..." : "▶ Run Demo (100 micro-disputes)"}
            </Button>
            
            {/* Value Prop */}
            {demoStats.total === 100 && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      The Infrastructure Model
                    </p>
                    <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                      <li>✅ <strong>You stay in control:</strong> Your team makes all final decisions</li>
                      <li>✅ <strong>95% automation:</strong> AI handles routine disputes instantly</li>
                      <li>✅ <strong>5% human review:</strong> Complex cases routed to your queue</li>
                      <li>✅ <strong>Learns from you:</strong> AI improves from your overrides</li>
                      <li>✅ <strong>Your domain expertise:</strong> You know your business best</li>
                    </ul>
                    <p className="text-xs mt-3 text-gray-500 dark:text-gray-400">
                      Traditional: $20-50/dispute, 10+ days • Consulate: $0.05/dispute, &lt;5 minutes
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Live Dispute Monitor */}
        <LiveDisputeMonitor />
      </div>
    </DashboardLayout>
  )
}