import { AEBBuilder } from './aeb';
import { StorageClient } from './storage';
import { CourtClient } from './client';
import { AgentConfig, WrapperOptions, ModelInfo } from './types';
import { sha256 } from './crypto';

export class EvidenceWrapper {
  private aebBuilder: AEBBuilder;
  private storageClient: StorageClient;
  private courtClient: CourtClient;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.aebBuilder = new AEBBuilder(config.did, config.ownerDid, config.privateKey);
    this.storageClient = new StorageClient(config.storage);
    this.courtClient = new CourtClient(config);
  }

  /**
   * Wrap a tool call with evidence collection
   */
  wrapToolCall<T extends (...args: any[]) => any>(
    fn: T,
    options: WrapperOptions
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const requestTs = Date.now();
      
      try {
        // Execute the original function
        const result = await fn(...args);
        const responseTs = Date.now();

        // Add entry to AEB
        this.aebBuilder.addEntry(
          options.toolName,
          args,
          result,
          options.model,
          requestTs,
          responseTs
        );

        // Set context if provided
        if (options.context) {
          this.aebBuilder.setContext(options.context);
        }

        return result;
      } catch (error) {
        const responseTs = Date.now();

        // Add error entry to AEB
        this.aebBuilder.addEntry(
          options.toolName,
          args,
          { error: error instanceof Error ? error.message : String(error) },
          options.model,
          requestTs,
          responseTs
        );

        throw error;
      }
    };
  }

  /**
   * Finalize and submit evidence
   */
  async submitEvidence(caseId?: string): Promise<string> {
    // Build the AEB
    const aeb = await this.aebBuilder.build();
    const aebJson = JSON.stringify(aeb);
    const aebBuffer = Buffer.from(aebJson, 'utf8');
    const aebHash = sha256(aebBuffer);

    // Upload to storage
    const { uri } = await this.storageClient.uploadEvidence(
      this.config.did,
      aebBuffer,
      aebHash
    );

    // Submit evidence manifest to court
    const evidenceId = await this.courtClient.submitEvidence({
      sha256: aebHash,
      uri,
      signer: aeb.signer,
      model: aeb.entries[0]?.model || {
        provider: 'unknown',
        name: 'unknown',
        version: '1.0',
      },
      tool: aeb.entries[0]?.tool,
      caseId,
    });

    // Clear the builder for next use
    this.aebBuilder.clear();

    return evidenceId;
  }

  /**
   * Create a decorator for automatic evidence collection
   */
  createDecorator(options: WrapperOptions) {
    return <T extends (...args: any[]) => any>(
      target: any,
      propertyKey: string,
      descriptor: TypedPropertyDescriptor<T>
    ) => {
      const originalMethod = descriptor.value!;
      
      descriptor.value = this.wrapToolCall(originalMethod, {
        ...options,
        toolName: options.toolName || propertyKey,
      }) as T;
      
      return descriptor;
    };
  }

  /**
   * Batch multiple tool calls into a single evidence bundle
   */
  async batchToolCalls<T>(
    calls: Array<{
      fn: () => Promise<T>;
      toolName: string;
      model: ModelInfo;
      context?: Record<string, any>;
    }>,
    caseId?: string
  ): Promise<{ results: T[]; evidenceId: string }> {
    const results: T[] = [];

    // Execute all calls and collect evidence
    for (const call of calls) {
      const wrappedFn = this.wrapToolCall(call.fn, {
        toolName: call.toolName,
        model: call.model,
        context: call.context,
      });

      const result = await wrappedFn();
      results.push(result);
    }

    // Submit evidence
    const evidenceId = await this.submitEvidence(caseId);

    return { results, evidenceId };
  }
}

/**
 * Create a simple wrapper function for one-off tool calls
 */
export async function wrapAndSubmit<T>(
  fn: () => Promise<T>,
  config: AgentConfig,
  options: WrapperOptions,
  caseId?: string
): Promise<{ result: T; evidenceId: string }> {
  const wrapper = new EvidenceWrapper(config);
  const wrappedFn = wrapper.wrapToolCall(fn, options);
  
  const result = await wrappedFn();
  const evidenceId = await wrapper.submitEvidence(caseId);
  
  return { result, evidenceId };
}
