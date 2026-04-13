import { Injectable, BadRequestException } from '@nestjs/common';
import { AllowedMimeType } from '../media/dto/request-upload.dto';

/**
 * File magic numbers (file signatures)
 * Used to verify actual file type regardless of extension
 */
const FILE_MAGIC_NUMBERS: Record<AllowedMimeType, Buffer[]> = {
  'image/jpeg': [
    Buffer.from([0xff, 0xd8, 0xff]), // JPEG
  ],
  'image/png': [
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG
  ],
  'image/webp': [
    Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF (WebP)
  ],
  'image/heic': [
    Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]), // HEIC
    Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]), // HEIC
  ],
};

/**
 * Dangerous file extensions to block
 */
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.ps1',
  '.msi', '.dll', '.vbs', '.js', '.jar',
  '.app', '.deb', '.rpm', '.dmg',
];

@Injectable()
export class FileValidationService {
  /**
   * Validate file type using magic numbers
   * @param buffer File buffer to validate
   *param declaredMimeType Declared MIME type from request
   *returns true if valid, throws exception if invalid
   */
  validateFileByMagicNumber(buffer: Buffer, declaredMimeType: AllowedMimeType): boolean {
    if (!Buffer.isBuffer(buffer) || buffer.length < 8) {
      throw new BadRequestException('Invalid file buffer');
    }

    const magicNumbers = FILE_MAGIC_NUMBERS[declaredMimeType];

    if (!magicNumbers) {
      throw new BadRequestException(`Unsupported MIME type: ${declaredMimeType}`);
    }

    // Check if file starts with any of the expected magic numbers
    const isValid = magicNumbers.some((magicNumber) =>
      buffer.subarray(0, magicNumber.length).equals(magicNumber),
    );

    if (!isValid) {
      throw new BadRequestException(
        `File content does not match declared type: ${declaredMimeType}`,
      );
    }

    return true;
  }

  /**
   * Validate filename is safe
   * @param filename Original filename
   * @returns true if safe, throws exception if dangerous
   */
  validateFilename(filename: string): boolean {
    if (!filename || typeof filename !== 'string') {
      throw new BadRequestException('Invalid filename');
    }

    const lowerFilename = filename.toLowerCase();

    // Check for dangerous extensions
    const hasDangerousExtension = DANGEROUS_EXTENSIONS.some((ext) =>
      lowerFilename.endsWith(ext),
    );

    if (hasDangerousExtension) {
      throw new BadRequestException(
        `Dangerous file extension detected: ${filename}`,
      );
    }

    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException(
        'Invalid filename: path traversal detected',
      );
    }

    return true;
  }

  /**
   * Validate MIME type is allowed
   * @param mimeType MIME type to validate
   * @returns true if allowed, throws exception if not
   */
  validateMimeType(mimeType: string): mimeType is AllowedMimeType {
    const allowedTypes = Object.values(AllowedMimeType);

    if (!allowedTypes.includes(mimeType as AllowedMimeType)) {
      throw new BadRequestException(
        `MIME type not allowed: ${mimeType}. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Validate file size is within limits
   * @param fileSize File size in bytes
   * @param maxSize Maximum allowed size in bytes
   * @returns true if within limits
   */
  validateFileSize(fileSize: number, maxSize: number = 52428800): boolean {
    // Default max: 50MB
    if (fileSize > maxSize) {
      throw new BadRequestException(
        `File size ${fileSize} bytes exceeds maximum allowed size ${maxSize} bytes`,
      );
    }

    if (fileSize <= 0) {
      throw new BadRequestException('File size must be greater than 0');
    }

    return true;
  }

  /**
   * Comprehensive file validation
   * @param buffer File buffer
   * @param declaredMimeType Declared MIME type
   * @param filename Original filename
   * @param fileSize File size in bytes
   * @param maxSize Maximum allowed file size
   * @returns true if all validations pass
   */
  validateFile(
    buffer: Buffer,
    declaredMimeType: AllowedMimeType,
    filename: string,
    fileSize: number,
    maxSize: number = 104857600,
  ): boolean {
    this.validateMimeType(declaredMimeType);
    this.validateFileByMagicNumber(buffer, declaredMimeType);
    this.validateFilename(filename);
    this.validateFileSize(fileSize, maxSize);

    return true;
  }
}
