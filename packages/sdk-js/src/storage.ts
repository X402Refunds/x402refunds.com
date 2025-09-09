import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageConfig } from './types';

export class StorageClient {
  private s3: S3Client;
  private bucketName: string;

  constructor(config: StorageConfig) {
    this.bucketName = config.bucketName;
    
    // Configure S3 client for R2 or B2
    const clientConfig: any = {
      region: 'auto',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    };

    if (config.driver === 'r2') {
      clientConfig.endpoint = config.endpoint || `https://${config.accountId}.r2.cloudflarestorage.com`;
    } else if (config.driver === 'b2') {
      clientConfig.endpoint = config.endpoint || 'https://s3.us-west-000.backblazeb2.com';
    }

    this.s3 = new S3Client(clientConfig);
  }

  /**
   * Upload a blob to object storage
   */
  async putBlob(data: Buffer | Uint8Array, key: string, contentType = 'application/octet-stream'): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: data,
      ContentType: contentType,
    });

    await this.s3.send(command);
    
    // Return the object URL
    return `https://${this.bucketName}/${key}`;
  }

  /**
   * Get a signed URL for accessing an object
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3, command, { expiresIn });
  }

  /**
   * Generate a unique key for evidence storage
   */
  generateEvidenceKey(agentDid: string, sha256: string): string {
    const timestamp = Date.now();
    return `evidence/${agentDid}/${timestamp}-${sha256.substring(0, 16)}.aeb`;
  }

  /**
   * Upload evidence bundle
   */
  async uploadEvidence(
    agentDid: string,
    evidenceData: Buffer,
    sha256: string
  ): Promise<{ uri: string; key: string }> {
    const key = this.generateEvidenceKey(agentDid, sha256);
    const uri = await this.putBlob(evidenceData, key, 'application/json');
    
    return { uri, key };
  }
}
