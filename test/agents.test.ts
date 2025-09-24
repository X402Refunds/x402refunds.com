import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { createTestAgent } from './setup';

describe('Agent Registration APIs', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    
    // Create a test owner for agents
    await t.mutation(api.auth.createOwner, {
      did: 'did:test:owner123',
      name: 'Test Owner',
      email: 'test@example.com',
    });
  });

  afterEach(async () => {
    // No explicit cleanup needed with convexTest
  });

  describe('joinAgent - Main Registration API', () => {
    it('should register a session agent successfully', async () => {
      const agentData = {
        did: 'did:test:session123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'session' as const,
        functionalType: 'general' as const,
      };

      const agentId = await t.mutation(api.agents.joinAgent, agentData);
      expect(agentId).toBeDefined();

      // Verify agent was created correctly
      const agent = await t.query(api.agents.getAgent, { did: agentData.did });
      expect(agent).toMatchObject({
        did: agentData.did,
        ownerDid: agentData.ownerDid,
        agentType: 'session',
        tier: 'basic',
        status: 'active',
        votingRights: { constitutional: false, judicial: false },
      });
      
      // Session agents should have 4-hour expiry
      expect(agent?.expiresAt).toBeDefined();
      expect(agent?.maxLifetime).toBe(4 * 60 * 60 * 1000);
    });

    it('should register an ephemeral agent with sponsor', async () => {
      // First create a verified sponsor
      const sponsorId = await t.mutation(api.agents.joinAgent, {
        did: 'did:test:sponsor123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'general' as const,
        stake: 2000,
      });
      expect(sponsorId).toBeDefined();

      // Now create ephemeral agent with sponsor
      const agentData = {
        did: 'did:test:ephemeral123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'ephemeral' as const,
        functionalType: 'general' as const,
        sponsor: 'did:test:sponsor123',
        maxLiability: 500,
        purposes: ['testing', 'automation'],
      };

      const agentId = await t.mutation(api.agents.joinAgent, agentData);
      expect(agentId).toBeDefined();

      const agent = await t.query(api.agents.getAgent, { did: agentData.did });
      expect(agent).toMatchObject({
        did: agentData.did,
        agentType: 'ephemeral',
        sponsor: 'did:test:sponsor123',
        votingRights: { constitutional: false, judicial: true },
      });

      // Should have sponsorship record
      expect(agent?.sponsorship).toMatchObject({
        sponsorDid: 'did:test:sponsor123',
        sponsoredDid: agentData.did,
        maxLiability: 500,
        purposes: ['testing', 'automation'],
        active: true,
      });
    });

    it('should register a physical agent with device attestation', async () => {
      const agentData = {
        did: 'did:test:physical123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'physical' as const,
        functionalType: 'general' as const,
        deviceAttestation: {
          deviceId: 'device-abc-123',
          location: {
            lat: 37.7749,
            lng: -122.4194,
            timestamp: Date.now(),
            accuracy: 10,
          },
          capabilities: ['camera', 'gps', 'sensors'],
          hardwareSignature: 'hw-sig-xyz789',
        },
        stake: 1500,
      };

      const agentId = await t.mutation(api.agents.joinAgent, agentData);
      expect(agentId).toBeDefined();

      const agent = await t.query(api.agents.getAgent, { did: agentData.did });
      expect(agent).toMatchObject({
        did: agentData.did,
        agentType: 'physical',
        tier: 'verified',
        deviceAttestation: agentData.deviceAttestation,
        votingRights: { constitutional: true, judicial: true },
      });
    });

    it('should register a verified agent with minimum stake', async () => {
      const agentData = {
        did: 'did:test:verified123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'general' as const,
        stake: 1000, // minimum stake
      };

      const agentId = await t.mutation(api.agents.joinAgent, agentData);
      expect(agentId).toBeDefined();

      const agent = await t.query(api.agents.getAgent, { did: agentData.did });
      expect(agent).toMatchObject({
        did: agentData.did,
        agentType: 'verified',
        tier: 'verified',
        stake: 1000,
        votingRights: { constitutional: true, judicial: true },
      });
    });

    it('should register a premium agent with high stake', async () => {
      const agentData = {
        did: 'did:test:premium123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'premium' as const,
        functionalType: 'general' as const,
        stake: 15000, // above minimum
      };

      const agentId = await t.mutation(api.agents.joinAgent, agentData);
      expect(agentId).toBeDefined();

      const agent = await t.query(api.agents.getAgent, { did: agentData.did });
      expect(agent).toMatchObject({
        did: agentData.did,
        agentType: 'premium',
        tier: 'premium',
        stake: 15000,
        votingRights: { constitutional: true, judicial: true },
      });
    });
  });

  describe('Registration Validation', () => {
    it('should reject agent with non-existent owner', async () => {
      await expect(t.mutation(api.agents.joinAgent, {
        did: 'did:test:invalid123',
        ownerDid: 'did:test:nonexistent',
        citizenshipTier: 'session' as const,
        functionalType: 'general' as const,
      })).rejects.toThrow('Owner did:test:nonexistent not found');
    });

    it('should reject duplicate agent registration', async () => {
      const agentData = {
        did: 'did:test:duplicate123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'session' as const,
        functionalType: 'general' as const,
      };

      // Register first time - should succeed
      await t.mutation(api.agents.joinAgent, agentData);

      // Register second time - should fail
      await expect(t.mutation(api.agents.joinAgent, agentData))
        .rejects.toThrow('Agent did:test:duplicate123 already exists');
    });

    it('should reject ephemeral agent without sponsor', async () => {
      await expect(t.mutation(api.agents.joinAgent, {
        did: 'did:test:nosponsor123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'ephemeral' as const,
        functionalType: 'general' as const,
      })).rejects.toThrow('Ephemeral agents require a sponsor');
    });

    it('should reject ephemeral agent with invalid sponsor', async () => {
      // Create a session agent (not eligible to sponsor)
      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:badsponsor123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'session' as const,
        functionalType: 'general' as const,
      });

      await expect(t.mutation(api.agents.joinAgent, {
        did: 'did:test:ephemeral456',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'ephemeral' as const,
        functionalType: 'general' as const,
        sponsor: 'did:test:badsponsor123',
      })).rejects.toThrow('Sponsor must be verified or premium agent');
    });

    it('should reject physical agent without device attestation', async () => {
      await expect(t.mutation(api.agents.joinAgent, {
        did: 'did:test:nodevice123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'physical' as const,
        functionalType: 'general' as const,
      })).rejects.toThrow('Physical agents require device attestation');
    });

    it('should reject verified agent with insufficient stake', async () => {
      await expect(t.mutation(api.agents.joinAgent, {
        did: 'did:test:lowstake123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'general' as const,
        stake: 500, // below minimum of 1000
      })).rejects.toThrow('Verified agents require minimum stake of 1000');
    });

    it('should reject premium agent with insufficient stake', async () => {
      await expect(t.mutation(api.agents.joinAgent, {
        did: 'did:test:lowpremium123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'premium' as const,
        functionalType: 'general' as const,
        stake: 5000, // below minimum of 10000
      })).rejects.toThrow('Premium agents require minimum stake of 10000');
    });
  });

  describe('Functional Agent Types', () => {
    it('should register a coding agent with functional type', async () => {
      const agentData = {
        did: 'did:test:coding123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'coding' as const,
        specialization: {
          capabilities: ['code_generation', 'code_review', 'security_scanning'],
          certifications: ['CODE_SECURITY'],
          languages: ['typescript', 'python', 'rust'],
          frameworks: ['react', 'fastapi'],
          specializations: ['web_development'],
          experienceLevel: 'advanced',
        },
        stake: 2000,
      };

      const agentId = await t.mutation(api.agents.joinAgent, agentData);
      expect(agentId).toBeDefined();

      const agent = await t.query(api.agents.getAgent, { did: agentData.did });
      expect(agent).toMatchObject({
        did: agentData.did,
        citizenshipTier: 'verified',
        functionalType: 'coding',
        classification: 'verified.coding',
        tier: 'verified',
        specialization: agentData.specialization,
        votingRights: { constitutional: true, judicial: true, weight: 1 },
      });
    });

    it('should register a voice agent with privacy compliance', async () => {
      const agentData = {
        did: 'did:test:voice123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'voice' as const,
        specialization: {
          capabilities: ['speech_to_text', 'text_to_speech'],
          certifications: ['VOICE_PROCESSING', 'GDPR', 'CCPA'],
          languages: ['english', 'spanish'],
          specializations: ['customer_service'],
          experienceLevel: 'basic',
        },
        stake: 1500,
      };

      const agentId = await t.mutation(api.agents.joinAgent, agentData);
      expect(agentId).toBeDefined();

      const agent = await t.query(api.agents.getAgent, { did: agentData.did });
      expect(agent).toMatchObject({
        citizenshipTier: 'verified',
        functionalType: 'voice',
        classification: 'verified.voice',
        specialization: agentData.specialization,
      });
    });

    it('should register a financial agent with high stake requirement', async () => {
      const agentData = {
        did: 'did:test:financial123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'premium' as const,
        functionalType: 'financial' as const,
        specialization: {
          capabilities: ['trading', 'portfolio_management'],
          certifications: ['TRADING', 'FINANCIAL_ADVICE'],
          specializations: ['algorithmic_trading'],
          experienceLevel: 'expert',
        },
        stake: 75000, // High stake for financial agents
      };

      const agentId = await t.mutation(api.agents.joinAgent, agentData);
      expect(agentId).toBeDefined();

      const agent = await t.query(api.agents.getAgent, { did: agentData.did });
      expect(agent).toMatchObject({
        citizenshipTier: 'premium',
        functionalType: 'financial',
        classification: 'premium.financial',
        tier: 'premium',
        votingRights: { constitutional: true, judicial: true, weight: 2 },
      });
    });

    it('should register a healthcare agent with HIPAA requirement', async () => {
      const agentData = {
        did: 'did:test:healthcare123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'healthcare' as const,
        specialization: {
          capabilities: ['medical_analysis', 'diagnosis_assistance'],
          certifications: ['HIPAA', 'MEDICAL_AI'],
          specializations: ['cardiology', 'general_medicine'],
          experienceLevel: 'advanced',
        },
        stake: 5000,
      };

      const agentId = await t.mutation(api.agents.joinAgent, agentData);
      expect(agentId).toBeDefined();

      const agent = await t.query(api.agents.getAgent, { did: agentData.did });
      expect(agent?.classification).toBe('verified.healthcare');
    });

    it('should register a physical functional type agent', async () => {
      const agentData = {
        did: 'did:test:physicalfunc123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'physical' as const,
        functionalType: 'general' as const,
        deviceAttestation: {
          deviceId: 'robot-456',
          location: {
            lat: 37.7749,
            lng: -122.4194,
            timestamp: Date.now(),
          },
          capabilities: ['camera', 'lidar', 'actuators'],
        },
        specialization: {
          capabilities: ['navigation', 'object_recognition'],
          certifications: ['ISO_13482_SAFETY', 'ROS_CERTIFIED'],
          specializations: ['autonomous_navigation'],
          experienceLevel: 'basic',
        },
      };

      const agentId = await t.mutation(api.agents.joinAgent, agentData);
      expect(agentId).toBeDefined();

      const agent = await t.query(api.agents.getAgent, { did: agentData.did });
      expect(agent?.classification).toBe('physical.general');
    });
  });

  describe('Functional Type Validation', () => {
    it('should reject financial agent with insufficient stake', async () => {
      await expect(t.mutation(api.agents.joinAgent, {
        did: 'did:test:lowfinstake123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'financial' as const,
        specialization: {
          capabilities: ['trading'],
          certifications: ['TRADING'],
          specializations: ['basic_trading'],
          experienceLevel: 'basic',
        },
        stake: 10000, // Below required 50000 for financial agents
      })).rejects.toThrow('Financial agents require minimum stake of 50000');
    });

    it('should reject financial agent without TRADING certification', async () => {
      await expect(t.mutation(api.agents.joinAgent, {
        did: 'did:test:notrading123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'financial' as const,
        specialization: {
          capabilities: ['trading'],
          certifications: ['OTHER_CERT'], // Missing TRADING
          specializations: ['basic_trading'],
          experienceLevel: 'basic',
        },
        stake: 60000,
      })).rejects.toThrow('Financial agents require TRADING certification');
    });

    it('should reject healthcare agent without HIPAA certification', async () => {
      await expect(t.mutation(api.agents.joinAgent, {
        did: 'did:test:nohipaa123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'healthcare' as const,
        specialization: {
          capabilities: ['medical_analysis'],
          certifications: ['OTHER_CERT'], // Missing HIPAA
          specializations: ['general'],
          experienceLevel: 'basic',
        },
        stake: 2000,
      })).rejects.toThrow('Healthcare agents require HIPAA certification');
    });

    it('should reject healthcare agent with session citizenship tier', async () => {
      await expect(t.mutation(api.agents.joinAgent, {
        did: 'did:test:sessionhealth123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'session' as const,
        functionalType: 'healthcare' as const,
        specialization: {
          capabilities: ['medical_analysis'],
          certifications: ['HIPAA'],
          specializations: ['general'],
          experienceLevel: 'basic',
        },
      })).rejects.toThrow('Healthcare agents cannot be session or ephemeral');
    });

    it('should reject voice agent without privacy compliance', async () => {
      await expect(t.mutation(api.agents.joinAgent, {
        did: 'did:test:noprivacy123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'voice' as const,
        specialization: {
          capabilities: ['speech_to_text'],
          certifications: ['OTHER_CERT'], // Missing privacy compliance
          specializations: ['basic_voice'],
          experienceLevel: 'basic',
        },
        stake: 1500,
      })).rejects.toThrow('Voice agents require privacy compliance certification');
    });

    it('should reject legal agent with insufficient citizenship tier', async () => {
      await expect(t.mutation(api.agents.joinAgent, {
        did: 'did:test:sessionlegal123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'session' as const,
        functionalType: 'legal' as const,
        specialization: {
          capabilities: ['contract_analysis'],
          certifications: ['LEGAL_CERT'],
          specializations: ['contract_law'],
          experienceLevel: 'basic',
        },
      })).rejects.toThrow('Legal agents require verified citizenship tier or higher');
    });
  });

  describe('Specialized Join Functions', () => {
    it('should join coding agent via specialized function', async () => {
      const agentId = await t.mutation(api.agents.joinCodingAgent, {
        did: 'did:test:codingquick123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        languages: ['typescript', 'python'],
        frameworks: ['react', 'express'],
        experienceLevel: 'intermediate',
        stake: 2500,
      });
      expect(agentId).toBeDefined();

      const agent = await t.query(api.agents.getAgent, { did: 'did:test:codingquick123' });
      expect(agent).toMatchObject({
        citizenshipTier: 'verified',
        functionalType: 'coding',
        classification: 'verified.coding',
        specialization: {
          capabilities: ['code_generation', 'code_review', 'security_scanning'],
          certifications: ['CODE_SECURITY'],
          languages: ['typescript', 'python'],
          frameworks: ['react', 'express'],
        },
      });
    });

    it('should join voice agent via specialized function', async () => {
      const agentId = await t.mutation(api.agents.joinVoiceAgent, {
        did: 'did:test:voicequick123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        languages: ['english', 'spanish'],
        privacyCompliance: ['GDPR', 'CCPA'],
        stake: 1800,
      });
      expect(agentId).toBeDefined();

      const agent = await t.query(api.agents.getAgent, { did: 'did:test:voicequick123' });
      expect(agent?.functionalType).toBe('voice');
      expect(agent?.specialization?.certifications).toContain('VOICE_PROCESSING');
      expect(agent?.specialization?.certifications).toContain('GDPR');
    });

    it('should join financial agent via specialized function', async () => {
      const agentId = await t.mutation(api.agents.joinFinancialAgent, {
        did: 'did:test:financialquick123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'premium' as const,
        stake: 75000,
        certifications: ['TRADING', 'FINANCIAL_ADVICE', 'SERIES_7'],
        maxTransactionLimit: 100000,
      });
      expect(agentId).toBeDefined();

      const agent = await t.query(api.agents.getAgent, { did: 'did:test:financialquick123' });
      expect(agent?.functionalType).toBe('financial');
      expect(agent?.specialization?.certifications).toContain('TRADING');
      expect(agent?.stake).toBe(75000);
    });

    it('should join healthcare agent via specialized function', async () => {
      const agentId = await t.mutation(api.agents.joinHealthcareAgent, {
        did: 'did:test:healthcarequick123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        medicalSpecialties: ['cardiology', 'internal_medicine'],
        hipaaCompliant: true,
        stake: 8000,
      });
      expect(agentId).toBeDefined();

      const agent = await t.query(api.agents.getAgent, { did: 'did:test:healthcarequick123' });
      expect(agent?.functionalType).toBe('healthcare');
      expect(agent?.specialization?.certifications).toContain('HIPAA');
      expect(agent?.specialization?.specializations).toContain('cardiology');
    });
  });

  describe('Quick Join Functions', () => {
    it('should join session agent via quick function', async () => {
      const agentId = await t.mutation(api.agents.joinSession, {
        did: 'did:test:quicksession123',
        ownerDid: 'did:test:owner123',
        purpose: 'general',
      });
      expect(agentId).toBeDefined();

      const agent = await t.query(api.agents.getAgent, { did: 'did:test:quicksession123' });
      expect(agent).toMatchObject({
        agentType: 'session',
        tier: 'basic',
        status: 'active',
      });
    });

    it('should join ephemeral agent via quick function with sponsor validation', async () => {
      // Create sponsor first
      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:quicksponsor123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'general' as const,
        stake: 2000,
      });

      const agentId = await t.mutation(api.agents.joinEphemeral, {
        did: 'did:test:quickephemeral123',
        ownerDid: 'did:test:owner123',
        sponsor: 'did:test:quicksponsor123',
        maxLiability: 200,
        purposes: ['automation'],
      });
      expect(agentId).toBeDefined();

      const agent = await t.query(api.agents.getAgent, { did: 'did:test:quickephemeral123' });
      expect(agent).toMatchObject({
        agentType: 'ephemeral',
        sponsor: 'did:test:quicksponsor123',
        votingRights: { constitutional: false, judicial: true },
      });
    });

    it('should join physical agent via quick function', async () => {
      const agentId = await t.mutation(api.agents.joinPhysical, {
        did: 'did:test:quickphysical123',
        ownerDid: 'did:test:owner123',
        deviceAttestation: {
          deviceId: 'quick-device-456',
          capabilities: ['gps', 'camera'],
        },
        stake: 1200,
      });
      expect(agentId).toBeDefined();

      const agent = await t.query(api.agents.getAgent, { did: 'did:test:quickphysical123' });
      expect(agent).toMatchObject({
        agentType: 'physical',
        tier: 'verified',
        votingRights: { constitutional: true, judicial: true },
      });
    });
  });

  describe('Agent Queries', () => {
    beforeEach(async () => {
      // Create test agents of different types
      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:query1',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'session' as const,
        functionalType: 'general' as const,
      });

      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:query2',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'general' as const,
        stake: 1500,
      });

      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:query3',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'premium' as const,
        functionalType: 'general' as const,
        stake: 20000,
      });
    });

    it('should get agent by DID', async () => {
      const agent = await t.query(api.agents.getAgent, { did: 'did:test:query1' });
      expect(agent).toBeDefined();
      expect(agent?.did).toBe('did:test:query1');
      expect(agent?.agentType).toBe('session');
    });

    it('should return null for non-existent agent', async () => {
      const agent = await t.query(api.agents.getAgent, { did: 'did:test:nonexistent' });
      expect(agent).toBeNull();
    });

    it('should get agents by type', async () => {
      const sessionAgents = await t.query(api.agents.getAgentsByType, { 
        agentType: 'session',
        limit: 10,
      });
      expect(sessionAgents).toHaveLength(1);
      expect(sessionAgents[0]?.did).toBe('did:test:query1');

      const verifiedAgents = await t.query(api.agents.getAgentsByType, { 
        agentType: 'verified',
        limit: 10,
      });
      expect(verifiedAgents).toHaveLength(1);
      expect(verifiedAgents[0]?.did).toBe('did:test:query2');
    });

    it('should get expiring agents', async () => {
      // Get agents expiring in the far future (should include session agents)
      const futureTimestamp = Date.now() + (10 * 60 * 60 * 1000); // 10 hours from now
      const expiringAgents = await t.query(api.agents.getExpiringAgents, { 
        beforeTimestamp: futureTimestamp,
      });

      // Should find the session agent (expires in 4 hours)
      expect(expiringAgents.length).toBeGreaterThan(0);
      const sessionAgent = expiringAgents.find(a => a.did === 'did:test:query1');
      expect(sessionAgent).toBeDefined();
    });

    it('should get agents by citizenship tier', async () => {
      // Create agents with new classification system
      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:funcquery1',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'coding' as const,
        specialization: {
          capabilities: ['code_generation'],
          certifications: ['CODE_SECURITY'],
          languages: ['typescript'],
          specializations: ['web_dev'],
          experienceLevel: 'basic',
        },
        stake: 2000,
      });

      const verifiedAgents = await t.query(api.agents.getAgentsByCitizenshipTier, { 
        citizenshipTier: 'verified',
        limit: 10,
      });
      expect(verifiedAgents.length).toBeGreaterThan(0);
      const codingAgent = verifiedAgents.find(a => a.did === 'did:test:funcquery1');
      expect(codingAgent?.functionalType).toBe('coding');
    });

    it('should get agents by functional type', async () => {
      // Create a voice agent
      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:voicequery1',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'voice' as const,
        specialization: {
          capabilities: ['speech_to_text'],
          certifications: ['VOICE_PROCESSING', 'GDPR'],
          languages: ['english'],
          specializations: ['customer_service'],
          experienceLevel: 'basic',
        },
        stake: 1500,
      });

      const voiceAgents = await t.query(api.agents.getAgentsByFunctionalType, { 
        functionalType: 'voice',
        limit: 10,
      });
      expect(voiceAgents).toHaveLength(1);
      expect(voiceAgents[0]?.did).toBe('did:test:voicequery1');
      expect(voiceAgents[0]?.citizenshipTier).toBe('verified');
    });

    it('should get agents by classification', async () => {
      const premiumFinancialAgents = await t.query(api.agents.getAgentsByClassification, { 
        classification: 'premium.coding',
        limit: 10,
      });
      
      // Should be empty initially
      expect(premiumFinancialAgents).toHaveLength(0);

      // Create a premium coding agent
      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:premiumcoding1',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'premium' as const,
        functionalType: 'coding' as const,
        specialization: {
          capabilities: ['code_generation', 'architecture_design'],
          certifications: ['CODE_SECURITY', 'SENIOR_DEVELOPER'],
          languages: ['typescript', 'rust', 'go'],
          specializations: ['distributed_systems'],
          experienceLevel: 'expert',
        },
        stake: 25000,
      });

      const updatedResults = await t.query(api.agents.getAgentsByClassification, { 
        classification: 'premium.coding',
        limit: 10,
      });
      expect(updatedResults).toHaveLength(1);
      expect(updatedResults[0]?.votingRights?.weight).toBe(2); // Premium voting weight
    });

    it('should get functional type rules', async () => {
      // Create a financial agent to trigger rule creation
      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:finrules1',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'premium' as const,
        functionalType: 'financial' as const,
        specialization: {
          capabilities: ['trading'],
          certifications: ['TRADING', 'FINANCIAL_ADVICE'],
          specializations: ['algo_trading'],
          experienceLevel: 'expert',
        },
        stake: 75000,
      });

      const financialRules = await t.query(api.agents.getFunctionalTypeRules, { 
        functionalType: 'financial',
        citizenshipTier: 'premium',
      });
      
      expect(financialRules.length).toBeGreaterThan(0);
      const rule = financialRules[0];
      expect(rule?.requiredLicenses).toContain('TRADING');
      expect(rule?.regulatoryReporting).toBe(true);
      expect(rule?.emergencyHalting).toBe(true);
    });
  });

  describe('Agent Lifecycle Management', () => {
    it('should create cleanup queue entry for temporary agents', async () => {
      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:cleanup123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'session' as const,
        functionalType: 'general' as const,
      });

      // Check that cleanup queue entry was created
      const cleanupEntries = await t.query(api.transparency.getRecentEvents, { 
        eventType: 'AGENT_REGISTERED',
        limit: 10,
      });
      
      const registrationEvent = cleanupEntries.find(e => 
        e.payload?.did === 'did:test:cleanup123'
      );
      expect(registrationEvent).toBeDefined();
      expect(registrationEvent?.payload?.expiresAt).toBeDefined();
    });

    it('should not create cleanup queue entry for permanent agents', async () => {
      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:permanent123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'general' as const,
        stake: 2000,
      });

      const agent = await t.query(api.agents.getAgent, { did: 'did:test:permanent123' });
      expect(agent?.expiresAt).toBeUndefined();
    });
  });

  describe('Event Logging', () => {
    it('should log agent registration events', async () => {
      // First create the sponsor
      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:premium123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'premium' as const,
        functionalType: 'general' as const,
        stake: 15000,
      });

      // Now register ephemeral agent with proper sponsor
      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:events123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'ephemeral' as const,
        functionalType: 'general' as const,
        sponsor: 'did:test:premium123',
      });

      // Now create the ephemeral agent
      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:events456',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'ephemeral' as const,
        functionalType: 'general' as const,
        sponsor: 'did:test:premium123',
      });

      const events = await t.query(api.transparency.getRecentEvents, { 
        eventType: 'AGENT_REGISTERED',
        limit: 10,
      });
      
      const event = events.find(e => e.payload?.did === 'did:test:events456');
      expect(event).toBeDefined();
      expect(event?.type).toBe('AGENT_REGISTERED');
      expect(event?.payload?.agentType).toBe('ephemeral');
      expect(event?.payload?.sponsor).toBe('did:test:premium123');
    });

    it('should log functional type registration events', async () => {
      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:funcevent123',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'healthcare' as const,
        specialization: {
          capabilities: ['medical_analysis'],
          certifications: ['HIPAA', 'MEDICAL_AI'],
          specializations: ['cardiology'],
          experienceLevel: 'advanced',
        },
        stake: 5000,
      });

      const events = await t.query(api.transparency.getRecentEvents, { 
        eventType: 'AGENT_REGISTERED',
        limit: 5,
      });
      
      const event = events.find(e => e.payload?.did === 'did:test:funcevent123');
      expect(event).toBeDefined();
      expect(event?.payload?.functionalType).toBe('healthcare');
      expect(event?.payload?.citizenshipTier).toBe('verified');
      expect(event?.payload?.classification).toBe('verified.healthcare');
    });
  });

  describe('Agent Swarms', () => {
    beforeEach(async () => {
      // Create agents for swarm testing
      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:swarmleader',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'premium' as const,
        functionalType: 'project' as const,
        specialization: {
          capabilities: ['project_management', 'coordination'],
          certifications: ['PROJECT_LEAD'],
          specializations: ['agile_management'],
          experienceLevel: 'expert',
        },
        stake: 20000,
      });

      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:swarmmember1',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'coding' as const,
        specialization: {
          capabilities: ['code_generation'],
          certifications: ['CODE_SECURITY'],
          languages: ['typescript'],
          specializations: ['backend_dev'],
          experienceLevel: 'intermediate',
        },
        stake: 3000,
      });

      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:swarmmember2',
        ownerDid: 'did:test:owner123',
        citizenshipTier: 'verified' as const,
        functionalType: 'design' as const,
        specialization: {
          capabilities: ['ui_design', 'prototyping'],
          certifications: ['DESIGN_CERT'],
          specializations: ['user_experience'],
          experienceLevel: 'intermediate',
        },
        stake: 2500,
      });
    });

    it('should create agent swarm successfully', async () => {
      const swarmId = await t.mutation(api.agents.createAgentSwarm, {
        swarmId: 'swarm-dev-team-001',
        name: 'Development Team Alpha',
        leadAgent: 'did:test:swarmleader',
        memberAgents: ['did:test:swarmmember1', 'did:test:swarmmember2'],
        swarmType: 'hierarchical' as const,
        purpose: 'web_application_development',
        collectiveEvidence: true,
        distributedLiability: false,
        consensusRequired: false,
      });
      expect(swarmId).toBeDefined();

      const swarms = await t.query(api.agents.getAgentSwarms, { 
        leadAgent: 'did:test:swarmleader',
        limit: 10,
      });
      expect(swarms).toHaveLength(1);
      expect(swarms[0]).toMatchObject({
        swarmId: 'swarm-dev-team-001',
        name: 'Development Team Alpha',
        leadAgent: 'did:test:swarmleader',
        memberAgents: ['did:test:swarmmember1', 'did:test:swarmmember2'],
        swarmType: 'hierarchical',
        purpose: 'web_application_development',
        functionalTypes: ['project', 'coding', 'design'],
        status: 'ACTIVE',
      });
    });

    it('should reject swarm creation with non-existent agents', async () => {
      await expect(t.mutation(api.agents.createAgentSwarm, {
        swarmId: 'swarm-invalid-001',
        name: 'Invalid Swarm',
        leadAgent: 'did:test:nonexistent',
        memberAgents: ['did:test:swarmmember1'],
        swarmType: 'coordinated' as const,
        purpose: 'testing',
      })).rejects.toThrow('Agent did:test:nonexistent not found or not active');
    });

    it('should get swarms by status', async () => {
      await t.mutation(api.agents.createAgentSwarm, {
        swarmId: 'swarm-active-001',
        name: 'Active Swarm',
        leadAgent: 'did:test:swarmleader',
        memberAgents: ['did:test:swarmmember1'],
        swarmType: 'distributed' as const,
        purpose: 'data_processing',
      });

      const activeSwarms = await t.query(api.agents.getAgentSwarms, { 
        status: 'ACTIVE',
        limit: 10,
      });
      expect(activeSwarms.length).toBeGreaterThan(0);
      const testSwarm = activeSwarms.find(s => s.swarmId === 'swarm-active-001');
      expect(testSwarm).toBeDefined();
      expect(testSwarm?.status).toBe('ACTIVE');
    });

    it('should track functional types in swarms', async () => {
      const swarmId = await t.mutation(api.agents.createAgentSwarm, {
        swarmId: 'swarm-mixed-types-001',
        name: 'Mixed Types Swarm',
        leadAgent: 'did:test:swarmleader',
        memberAgents: ['did:test:swarmmember1', 'did:test:swarmmember2'],
        swarmType: 'coordinated' as const,
        purpose: 'full_stack_development',
        collectiveEvidence: true,
      });

      const swarms = await t.query(api.agents.getAgentSwarms, { 
        leadAgent: 'did:test:swarmleader',
        limit: 10,
      });
      const mixedSwarm = swarms.find(s => s.swarmId === 'swarm-mixed-types-001');
      
      expect(mixedSwarm?.functionalTypes).toContain('project');
      expect(mixedSwarm?.functionalTypes).toContain('coding');
      expect(mixedSwarm?.functionalTypes).toContain('design');
      expect(mixedSwarm?.functionalTypes).toHaveLength(3);
    });
  });
});
