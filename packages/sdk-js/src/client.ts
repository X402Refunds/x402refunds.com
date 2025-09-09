import { AgentConfig, EvidenceManifest, Case } from './types';
import { createAuthHeaders } from './crypto';

export class CourtClient {
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Submit evidence to the court
   */
  async submitEvidence(manifest: Omit<EvidenceManifest, 'agentDid'>): Promise<string> {
    const fullManifest: EvidenceManifest = {
      ...manifest,
      agentDid: this.config.did,
    };

    const body = JSON.stringify(fullManifest);
    const headers = await createAuthHeaders(
      'POST',
      '/evidence',
      body,
      this.config.did,
      this.config.privateKey
    );

    const response = await fetch(`${this.config.courtApiUrl}/evidence`, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Evidence submission failed: ${error}`);
    }

    const result = await response.json();
    return result.evidenceId;
  }

  /**
   * File a dispute
   */
  async fileDispute(dispute: Case): Promise<string> {
    const body = JSON.stringify(dispute);
    const headers = await createAuthHeaders(
      'POST',
      '/disputes',
      body,
      this.config.did,
      this.config.privateKey
    );

    const response = await fetch(`${this.config.courtApiUrl}/disputes`, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Dispute filing failed: ${error}`);
    }

    const result = await response.json();
    return result.caseId;
  }

  /**
   * Get case information
   */
  async getCase(caseId: string): Promise<any> {
    const response = await fetch(`${this.config.courtApiUrl}/cases/${caseId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.text();
      throw new Error(`Case retrieval failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Get ruling information
   */
  async getRuling(rulingId: string): Promise<any> {
    const response = await fetch(`${this.config.courtApiUrl}/rulings/${rulingId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.text();
      throw new Error(`Ruling retrieval failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Trigger autorule for a case
   */
  async triggerAutorule(caseId: string): Promise<any> {
    const headers = await createAuthHeaders(
      'POST',
      `/cases/${caseId}/autorule`,
      '',
      this.config.did,
      this.config.privateKey
    );

    const response = await fetch(`${this.config.courtApiUrl}/cases/${caseId}/autorule`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Autorule trigger failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Submit a panel vote (for judge agents)
   */
  async submitPanelVote(panelId: string, code: string, reasons: string): Promise<void> {
    const body = JSON.stringify({
      judgeId: this.config.did,
      code,
      reasons,
    });

    const headers = await createAuthHeaders(
      'POST',
      `/panels/${panelId}/vote`,
      body,
      this.config.did,
      this.config.privateKey
    );

    const response = await fetch(`${this.config.courtApiUrl}/panels/${panelId}/vote`, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Panel vote submission failed: ${error}`);
    }
  }
}
