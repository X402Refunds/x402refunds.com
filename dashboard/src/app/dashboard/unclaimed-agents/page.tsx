"use client";

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { UnclaimedAgentCard } from '@/components/dashboard/unclaimed-agent-card';
import { ClaimAgentDialog } from '@/components/dashboard/claim-agent-dialog';
import { AlertTriangle } from 'lucide-react';

type UnclaimedAgent = NonNullable<ReturnType<typeof useQuery<typeof api.agents.listUnclaimedAgents>>>[number];

export default function UnclaimedAgentsPage() {
  const unclaimedAgents = useQuery(api.agents.listUnclaimedAgents, { limit: 50 });
  const currentUser = useQuery(api.users.getCurrentUser);
  const organization = useQuery(
    api.users.getUserOrganization,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );
  const [selectedAgent, setSelectedAgent] = useState<UnclaimedAgent | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          Unclaimed Agents
        </h1>
        <p className="text-muted-foreground mt-2">
          Agents with disputes that have not been claimed by their owners yet.
          Connect your wallet to claim ownership.
        </p>
      </div>

      {unclaimedAgents && unclaimedAgents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No unclaimed agents at this time.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {unclaimedAgents?.map((agent) => (
          <UnclaimedAgentCard
            key={agent._id}
            agent={agent}
            onClaim={() => setSelectedAgent(agent)}
          />
        ))}
      </div>

      {selectedAgent && (
        <ClaimAgentDialog
          agent={selectedAgent}
          open={true}
          onClose={() => setSelectedAgent(null)}
          onSuccess={() => {
            setSelectedAgent(null);
            // Agents list will auto-refresh via Convex
          }}
          organizationId={organization?._id}
          userId={currentUser?._id}
        />
      )}
    </div>
  );
}

