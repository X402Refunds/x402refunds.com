import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";
import workflow from "@convex-dev/workflow/convex.config";
import workpool from "@convex-dev/workpool/convex.config";

const app = defineApp();

// Agent component for AI agent definitions
app.use(agent, { name: "agent" });

// Workflow component for durable, long-running workflows
app.use(workflow, { name: "workflow" });

// Workpool components for controlled parallelism
app.use(workpool, { name: "evidenceWorkpool" });
app.use(workpool, { name: "judgeWorkpool" });
app.use(workpool, { name: "researchWorkpool" });

export default app;









