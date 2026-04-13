/**
 * Sharp Mock
 * Mocks Sharp image processing operations
 */

const mockSharpInstance = {
  metadata: jest.fn(),
  resize: jest.fn(),
  clone: jest.fn(),
  jpeg: jest.fn(),
  png: jest.fn(),
  webp: jest.fn(),
  toBuffer: jest.fn(),
  withMetadata: jest.fn(),
  rotate: jest.fn(),
  flip: jest.fn(),
  flop: jest.fn(),
  sharpen: jest.fn(),
  modulate: jest.fn(),
};

// Mock the sharp constructor
jest.mock('sharp', () => {
  const sharp = jest.fn(() => mockSharpInstance);
  return Object.assign(sharp, {
    format: {},
    queue: jest.fn(),
    concurrency: jest.fn(),
    cache: jest.fn(),
    simd: jest.fn(),
  });
});

export const sharp = require('sharp');

beforeEach(() => {
  // Reset all Sharp mocks
  mockSharpInstance.metadata.mockReset();
  mockSharpInstance.resize.mockReset();
  mockSharpInstance.clone.mockReset();
  mockSharpInstance.jpeg.mockReset();
  mockSharpInstance.png.mockReset();
  mockSharpInstance.webp.mockReset();
  mockSharpInstance.toBuffer.mockReset();

  // Setup chainable mocks
  mockSharpInstance.clone.mockReturnValue(mockSharpInstance);
  mockSharpInstance.resize.mockReturnValue(mockSharpInstance);
  mockSharpInstance.jpeg.mockReturnValue(mockSharpInstance);
  mockSharpInstance.png.mockReturnValue(mockSharpInstance);
  mockSharpInstance.webp.mockReturnValue(mockSharpInstance);

  // Default metadata
  mockSharpInstance.metadata.mockResolvedValue({
    format: 'jpeg',
    width: 1920,
    height: 1080,
    size: 1024000,
  });

  // Default buffer
  mockSharpInstance.toBuffer.mockResolvedValue(Buffer.from('mock-image-data'));
});

export default mockSharpInstance;
