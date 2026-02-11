import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class S3Config {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly endpoint: string;

  constructor(private configService: ConfigService) {
    this.endpoint = this.configService.get('S3_ENDPOINT') || 'http://localhost:9000';
    this.bucketName = this.configService.get('S3_BUCKET') || 'baby-photos';

    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: this.configService.get('S3_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY') || 'minioadmin',
        secretAccessKey: this.configService.get('S3_SECRET_KEY') || 'minioadmin',
      },
      // For local development with MinIO, we need to force path style
      forcePathStyle: true,
    });
  }

  getClient(): S3Client {
    return this.s3Client;
  }

  getBucketName(): string {
    return this.bucketName;
  }

  getEndpoint(): string {
    return this.endpoint;
  }
}
