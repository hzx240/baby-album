/**
 * AWS S3 Client Mock
 * Mocks all S3 operations
 */

import { mockDeep, MockProxy } from 'jest-mock-extended';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock S3 Client
export const mockS3Client = mockDeep<S3Client>();

// Mock getSignedUrl
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

export const mockGetSignedUrl = getSignedUrl as jest.Mock;

beforeEach(() => {
  // Reset all S3 client mocks
  mockS3Client.send.mockReset();
  mockGetSignedUrl.mockReset();

  // Default: successful presigned URL generation
  mockGetSignedUrl.mockResolvedValue('https://test-bucket.s3.amazonaws.com/test-key?signature=abc123');

  // Default: successful S3 operations
  mockS3Client.send.mockResolvedValue({
    $metadata: { httpStatusCode: 200 },
  });

  // Mock S3 GET response (for image download)
  mockS3Client.send.mockImplementation(async (command: any) => {
    const input = command.input;
    if (input.Key?.includes('original')) {
      return {
        $metadata: { httpStatusCode: 200 },
        Body: {
          on: jest.fn(),
          once: jest.fn(),
        },
        ContentLength: 1024000,
        ContentType: 'image/jpeg',
      };
    }
    return {
      $metadata: { httpStatusCode: 200 },
    };
  });
});

export default mockS3Client;
