"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, SkipForward, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type WorkflowStep = {
  _id: string;
  caseId: Id<"cases">;
  workflowId: string;
  stepNumber: number;
  stepName: string;
  agentName: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "SKIPPED" | "FAILED";
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  input?: unknown;
  output?: unknown;
  result?: string;
  verdict?: string;
  confidence?: number;
  error?: string;
};

export function AgentWorkflowTimeline({ caseId }: { caseId: Id<"cases"> }) {
  const workflowSteps = useQuery(api.workflows.getWorkflowStepsPublic, { caseId });
  const workflowStatus = useQuery(api.workflows.getWorkflowStatusPublic, { caseId });
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  if (!workflowSteps || workflowSteps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Workflow</CardTitle>
          <CardDescription>No workflow steps recorded yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStatusIcon = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case "FAILED":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "SKIPPED":
        return <SkipForward className="h-5 w-5 text-slate-400" />;
      case "RUNNING":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: WorkflowStep["status"]) => {
    const variants: Record<WorkflowStep["status"], "default" | "secondary" | "destructive" | "outline"> = {
      COMPLETED: "default",
      FAILED: "destructive",
      SKIPPED: "secondary",
      RUNNING: "default",
      PENDING: "outline",
    };
    
    const colors: Record<WorkflowStep["status"], string> = {
      COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
      FAILED: "bg-red-50 text-red-700 border-red-200",
      SKIPPED: "bg-slate-50 text-slate-500 border-slate-200",
      RUNNING: "bg-blue-50 text-blue-700 border-blue-200",
      PENDING: "bg-slate-50 text-slate-400 border-slate-200",
    };

    return (
      <Badge className={colors[status]} variant={variants[status]}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Agent Workflow Timeline</CardTitle>
            <CardDescription>
              {workflowStatus && (
                <>
                  {workflowStatus.completed} of {workflowStatus.total} steps completed
                  {workflowStatus.totalDurationMs > 0 && (
                    <> • Total duration: {formatDuration(workflowStatus.totalDurationMs)}</>
                  )}
                </>
              )}
            </CardDescription>
          </div>
          {workflowStatus && workflowStatus.currentStep && (
            <Badge className="bg-blue-50 text-blue-700 border-blue-200">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              {workflowStatus.currentStep.agentName}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workflowSteps.map((step: WorkflowStep, index: number) => {
            const isExpanded = expandedSteps.has(step._id);
            const isLast = index === workflowSteps.length - 1;

            return (
              <motion.div
                key={step._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative"
              >
                {/* Timeline connector */}
                {!isLast && (
                  <div className="absolute left-6 top-12 w-0.5 h-full bg-slate-200" />
                )}

                <div className="flex gap-4">
                  {/* Status icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(step.status)}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition-colors"
                      onClick={() => toggleStep(step._id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            )}
                            <h4 className="font-semibold text-slate-900">{step.agentName}</h4>
                            {getStatusBadge(step.status)}
                          </div>
                          <p className="text-sm text-slate-600 ml-6">
                            {step.result || step.stepName}
                          </p>
                          {step.verdict && (
                            <p className="text-sm font-medium text-emerald-700 ml-6 mt-1">
                              Verdict: {step.verdict}
                              {step.confidence !== undefined && (
                                <> ({(step.confidence * 100).toFixed(1)}% confidence)</>
                              )}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-slate-500 ml-6 mt-2">
                            <span>{formatTimestamp(step.startedAt)}</span>
                            {step.durationMs && (
                              <span>Duration: {formatDuration(step.durationMs)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-6 mt-2 overflow-hidden"
                        >
                          <Card className="bg-slate-50 border-slate-200">
                            <CardContent className="p-4 space-y-4">
                              {step.error && (
                                <div className="bg-red-50 border border-red-200 rounded p-3">
                                  <p className="text-sm font-medium text-red-900">Error:</p>
                                  <p className="text-sm text-red-700 mt-1">{step.error}</p>
                                </div>
                              )}

                              {step.output && (
                                <div className="space-y-3">
                                  <p className="text-sm font-medium text-slate-700 mb-2">Agent Output:</p>
                                  
                                  {/* Extract and display reasoning if available */}
                                  {(() => {
                                    type AgentOutput = {
                                      reasoning?: string;
                                      text?: string;
                                      analysis?: string;
                                      steps?: Array<{
                                        tool?: string;
                                        text?: string;
                                        result?: unknown;
                                      }>;
                                      keyFacts?: string[];
                                      redFlags?: string[];
                                      violations?: string[];
                                    };
                                    
                                    const output = step.output as string | AgentOutput | undefined;
                                    
                                    // Try to extract reasoning from various formats
                                    let reasoning: string | null = null;
                                    let analysis: string | null = null;
                                    let agentSteps: AgentOutput['steps'] = null;
                                    
                                    if (typeof output === 'string') {
                                      reasoning = output;
                                    } else if (output && typeof output === 'object') {
                                      reasoning = output.reasoning || output.text || output.analysis || null;
                                      analysis = output.analysis || output.text || null;
                                      agentSteps = output.steps || null;
                                    }
                                    
                                    return (
                                      <>
                                        {/* Main reasoning/analysis */}
                                        {(reasoning || analysis) && (
                                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                            <p className="text-sm font-medium text-blue-900 mb-2">Agent Reasoning:</p>
                                            <p className="text-sm text-blue-800 whitespace-pre-wrap">
                                              {reasoning || analysis}
                                            </p>
                                          </div>
                                        )}
                                        
                                        {/* Step-by-step reasoning from agent's internal steps */}
                                        {agentSteps && Array.isArray(agentSteps) && agentSteps.length > 0 && (
                                          <div>
                                            <p className="text-sm font-medium text-slate-700 mb-2">Step-by-Step Reasoning:</p>
                                            <div className="space-y-2">
                                              {agentSteps.map((agentStep, idx: number) => (
                                                <div key={idx} className="bg-white border border-slate-200 rounded p-3">
                                                  <div className="flex items-start gap-2 mb-1">
                                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                      Step {idx + 1}
                                                    </span>
                                                    {agentStep.tool && (
                                                      <Badge variant="outline" className="text-xs">
                                                        {agentStep.tool}
                                                      </Badge>
                                                    )}
                                                  </div>
                                                  {agentStep.text && (
                                                    <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap">
                                                      {agentStep.text}
                                                    </p>
                                                  )}
                                                  {agentStep.result && (
                                                    <pre className="text-xs bg-slate-50 p-2 rounded mt-1 overflow-auto">
                                                      {typeof agentStep.result === 'string' 
                                                        ? agentStep.result 
                                                        : JSON.stringify(agentStep.result, null, 2)}
                                                    </pre>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Full output as fallback */}
                                        {!reasoning && !analysis && !steps && (
                                          <pre className="text-xs bg-white p-3 rounded border border-slate-200 overflow-auto max-h-64">
                                            {typeof step.output === 'string' 
                                              ? step.output 
                                              : JSON.stringify(step.output, null, 2)}
                                          </pre>
                                        )}
                                        
                                        {/* Show structured data if available */}
                                        {output && typeof output === 'object' && !Array.isArray(output) && (output.keyFacts || output.redFlags || output.violations) && (
                                          <div className="space-y-2">
                                            {output.keyFacts && Array.isArray(output.keyFacts) && output.keyFacts.length > 0 && (
                                              <div>
                                                <p className="text-sm font-medium text-slate-700 mb-1">Key Facts:</p>
                                                <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                                                  {output.keyFacts.map((fact: string, idx: number) => (
                                                    <li key={idx}>{fact}</li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                            {output.redFlags && Array.isArray(output.redFlags) && output.redFlags.length > 0 && (
                                              <div>
                                                <p className="text-sm font-medium text-red-700 mb-1">Red Flags:</p>
                                                <ul className="text-xs text-red-600 list-disc list-inside space-y-1">
                                                  {output.redFlags.map((flag: string, idx: number) => (
                                                    <li key={idx}>{flag}</li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                            {output.violations && Array.isArray(output.violations) && output.violations.length > 0 && (
                                              <div>
                                                <p className="text-sm font-medium text-orange-700 mb-1">Violations:</p>
                                                <ul className="text-xs text-orange-600 list-disc list-inside space-y-1">
                                                  {output.violations.map((violation: string, idx: number) => (
                                                    <li key={idx}>{violation}</li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        
                                        {/* Raw output toggle for debugging */}
                                        <details className="mt-2">
                                          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                                            View raw output (JSON)
                                          </summary>
                                          <pre className="text-xs bg-white p-3 rounded border border-slate-200 overflow-auto max-h-64 mt-2">
                                            {JSON.stringify(step.output, null, 2)}
                                          </pre>
                                        </details>
                                      </>
                                    );
                                  })()}
                                </div>
                              )}

                              {step.input && (
                                <div>
                                  <p className="text-sm font-medium text-slate-700 mb-2">Input:</p>
                                  <pre className="text-xs bg-white p-3 rounded border border-slate-200 overflow-auto max-h-32">
                                    {typeof step.input === 'string' ? step.input : JSON.stringify(step.input, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

