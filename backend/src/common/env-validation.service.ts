import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvValidationService implements OnModuleInit {
  private readonly logger = new Logger(EnvValidationService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.validateRequiredEnvVars();
    this.validateJwtConfiguration();
    this.validateDatabaseConfiguration();
    this.validateS3Configuration();
    this.logger.log('✅ Environment validation passed');
  }

  /**
   * Validate required environment variables
   */
  private validateRequiredEnvVars() {
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'PORT',
    ];

    const missing = requiredVars.filter(
      (varName) => !this.configService.get(varName),
    );

    if (missing.length > 0) {
      throw new Error(
        `❌ Missing required environment variables: ${missing.join(', ')}\n` +
          `Please set them in your .env file before starting the application.`,
      );
    }
  }

  /**
   * Validate JWT security configuration
   */
  private validateJwtConfiguration() {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    // Check if JWT secret is still the default value
    const defaultSecrets = [
      'your-super-secret-jwt-key',
      'your-super-secret-jwt-key-change-this-in-production',
      'secret',
      'changeit',
    ];

    if (!jwtSecret || defaultSecrets.includes(jwtSecret)) {
      throw new Error(
        '❌ SECURITY ALERT: JWT_SECRET is using a default value!\n' +
          'Generate a secure random string (at least 32 characters):\n' +
          '  node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n' +
          'Or use: openssl rand -base64 48\n\n' +
          'Then update JWT_SECRET in your .env file',
      );
    }

    // Validate JWT secret strength
    if (jwtSecret && jwtSecret.length < 32) {
      this.logger.warn(
        `⚠️ JWT_SECRET length is ${jwtSecret.length} (minimum: 32 characters)`,
      );
    }

    // Log JWT configuration (without exposing the secret)
    const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    const refreshTokenExpiresIn = this.configService.get<string>(
      'REFRESH_TOKEN_EXPIRES_IN',
      '30d',
    );

    this.logger.log(`JWT Configuration:`);
    this.logger.log(`  Access Token TTL: ${jwtExpiresIn}`);
    this.logger.log(`  Refresh Token TTL: ${refreshTokenExpiresIn}`);
    this.logger.log(`  Secret Length: ${jwtSecret?.length || 0} chars ✅`);

    // Warn if using very long expiration times
    if (jwtExpiresIn && !jwtExpiresIn.match(/^\d+[m|h]$/)) {
      this.logger.warn(
        `⚠️ JWT_EXPIRES_IN should use 'm' (minutes) or 'h' (hours), got: ${jwtExpiresIn}`,
      );
    }
  }

  /**
   * Validate database configuration
   */
  private validateDatabaseConfiguration() {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('❌ DATABASE_URL is not configured');
    }

    // Check for PostgreSQL connection string (production recommended)
    if (databaseUrl.startsWith('file:')) {
      this.logger.warn(
        '⚠️ Using SQLite database (recommended for development only)',
      );
      this.logger.warn('For production, use PostgreSQL:');
      this.logger.warn('  DATABASE_URL="postgresql://user:password@localhost:5432/dbname"');
    }

    // Log database type
    const dbType = databaseUrl.includes('postgres')
      ? 'PostgreSQL'
      : databaseUrl.includes('mysql')
      ? 'MySQL'
      : databaseUrl.includes('file:')
      ? 'SQLite'
      : 'Unknown';

    this.logger.log(`Database Type: ${dbType}`);
  }

  /**
   * Validate S3/Object Storage configuration
   */
  private validateS3Configuration() {
    const s3Endpoint = this.configService.get<string>('S3_ENDPOINT');
    const s3Bucket = this.configService.get<string>('S3_BUCKET');
    const s3AccessKey = this.configService.get<string>('S3_ACCESS_KEY');

    if (!s3Endpoint || !s3Bucket || !s3AccessKey) {
      this.logger.warn('⚠️ S3 configuration incomplete');
      this.logger.warn('Photo upload functionality may not work properly');
    }

    // Check for default S3 credentials
    if (s3AccessKey === 'minioadmin') {
      this.logger.warn(
        '⚠️ Using default S3 credentials (minioadmin)',
      );
      this.logger.warn('Change S3_ACCESS_KEY and S3_SECRET_KEY for production');
    }

    // Validate S3 endpoint format
    if (s3Endpoint && !s3Endpoint.startsWith('http')) {
      this.logger.error(`❌ Invalid S3_ENDPOINT: ${s3Endpoint}`);
      this.logger.error('S3_ENDPOINT must start with http:// or https://');
    }
  }

  /**
   * Validate security settings
   */
  validateSecuritySettings() {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    if (nodeEnv === 'production') {
      // Check for CORS wildcard
      const corsOrigin = this.configService.get<string>('CORS_ORIGIN');
      if (corsOrigin === '*') {
        this.logger.error('❌ CORS_ORIGIN cannot be "*" in production');
      }

      // Check for insecure defaults
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret || jwtSecret.length < 64) {
        this.logger.warn(
          '⚠️ JWT_SECRET should be at least 64 characters in production',
        );
      }
    }
  }

  /**
   * Get JWT configuration summary (safe for logging)
   */
  getJwtConfigSummary() {
    return {
      accessTTL: this.configService.get<string>('JWT_EXPIRES_IN'),
      refreshTTL: this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN'),
      secretLength: this.configService
        .get<string>('JWT_SECRET')
        ?.length,
    };
  }
}
