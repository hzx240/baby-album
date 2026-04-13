import { Injectable } from '@nestjs/common';

const SENSITIVE_PATTERNS = {
  password: /password["\s:]+["']?([^"'\s,}]+)["'\']?/gi,
  pass: /pass["\s:]+["'\']?([^"'\s,}]+)["'\']?/gi,
  passwd: /passwd["\s:]+["'\']?([^"'\s,}]+)["'\']?/gi,
  bearer: /bearer\s+([a-zA-Z0-9._-]+)/gi,
  authorization: /authorization["\s:]+["'\']?([^"'\s,}]{20,})["'\']?/gi,
  accesstoken: /accesstoken["\s:]+["'\']?([^"'\s,}]{20,})["'\']?/gi,
  refreshtoken: /refreshtoken["\s:]+["'\']?([^"'\s,}]{20,})["'\']?/gi,
  apikey: /api[_-]?key["\s:]+["'\']?([^"'\s,}]{20,})["'\']?/gi,
  secretkey: /secret[_-]?key["\s:]+["'\']?([^"'\s,}]{20,})["'\']?/gi,
  privatekey: /private[_-]?key["\s:]+["'\']?([^"'\s,}]{20,})["'\']?/gi,
  awssecret: /aws[_-]?secret["\s:]+["'\']?([^"'\s,}]{20,})["'\']?/gi,
  sessionid: /session[_-]?id["\s:]+["'\']?([^"'\s,}]{20,})["'\']?/gi,
  sessiontoken: /session[_-]?token["\s:]+["'\']?([^"'\s,}]{20,})["'\']?/gi,
  csrf: /csrf["\s:]+["'\']?([^"'\s,}]{20,})["'\']?/gi,
  creditcard: /\b(?:\d[ -]*?){13,16}\b/g,
  ssn: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g,
};

const SENSITIVE_FIELDS = [
  'password', 'passwordHash', 'passwordhash', 'newPassword', 'newpassword',
  'currentPassword', 'currentpassword', 'accessToken', 'accesstoken',
  'refreshToken', 'refreshtoken', 'token', 'apiKey', 'apikey',
  'secret', 'secretKey', 'secretkey', 'privateKey', 'privatekey',
  'awsSecret', 'awssecret', 'sessionId', 'sessionid', 'csrfToken',
  'csrftoken', 'creditCard', 'creditcard', 'ssn', 'socialSecurity',
];

const SAFE_PATTERNS = [
  /password["\s:]+["'\']?\$\{.*?\}["'\']?/gi,
  /["'\']?hashed["'\']?/gi,
  /["'\']?encrypted["'\']?/gi,
];

@Injectable()
export class LogSanitizerService {
  private readonly enabled = true;

  sanitize(input: string): string {
    if (!input || typeof input !== 'string') {
      return input;
    }
    let sanitized = input;
    for (const [key, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
      sanitized = sanitized.replace(pattern, (match) => {
        for (const safePattern of SAFE_PATTERNS) {
          if (safePattern.test(match)) {
            return match;
          }
        }
        const parts = match.match(/^(\w+)["\s:]+["'\']?/);
        if (parts) {
          return `${parts[1]}: [REDACTED]`;
        }
        return '[REDACTED]';
      });
    }
    return sanitized;
  }

  sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_FIELDS.some((sf) => lowerKey.includes(sf.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  sanitizeHeaders(headers: any): any {
    if (!headers || typeof headers !== 'object') {
      return headers;
    }
    const sanitized: any = {};
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (['authorization', 'cookie', 'set-cookie', 'x-api-key'].includes(lowerKey)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  sanitizeError(error: any): any {
    if (!error) {
      return error;
    }
    if (typeof error === 'string') {
      return this.sanitize(error);
    }
    const sanitized: any = {
      message: this.sanitize(error.message || ''),
      name: error.name,
    };
    if (process.env.NODE_ENV !== 'production' && error.stack) {
      sanitized.stack = this.sanitize(error.stack);
    }
    for (const [key, value] of Object.entries(error)) {
      if (key === 'message' || key === 'name' || key === 'stack') {
        continue;
      }
      const sensitiveKeys = ['apiKey', 'secret', 'token', 'password', 'creditCard', 'ssn'];
      if (sensitiveKeys.includes(key)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  sanitizeUser(user: any): any {
    if (!user || typeof user !== 'object') {
      return user;
    }
    const sanitized: any = { id: user.id };
    const safeFields = ['id', 'email', 'displayName', 'role', 'familyId', 'status'];
    for (const field of safeFields) {
      if (user[field] !== undefined) {
        sanitized[field] = user[field];
      }
    }
    if (sanitized.email) {
      sanitized.email = this.maskEmail(sanitized.email);
    }
    return sanitized;
  }

  private maskEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return email;
    }
    const parts = email.split('@');
    if (parts.length !== 2) {
      return email;
    }
    const [username, domain] = parts;
    const maskedUsername = username.charAt(0) + '***';
    return `${maskedUsername}@${domain}`;
  }

  sanitizeAuditLog(details: any): any {
    const sanitized: any = {
      method: details.method,
      url: this.sanitizeUrl(details.url),
      ip: this.sanitizeIp(details.ip),
      userId: details.userId,
      action: details.action,
    };
    if (details.statusCode) {
      sanitized.statusCode = details.statusCode;
    }
    if (details.duration) {
      sanitized.duration = details.duration;
    }
    return sanitized;
  }

  private sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      return url;
    }
    try {
      const urlObj = new URL(url, 'http://dummy');
      const sensitiveParams = ['token', 'password', 'secret', 'key', 'api'];
      for (const param of sensitiveParams) {
        urlObj.searchParams.delete(param);
      }
      return urlObj.pathname + urlObj.search;
    } catch {
      return this.sanitize(url);
    }
  }

  private sanitizeIp(ip: string | null): string | null {
    if (!ip || typeof ip !== 'string') {
      return ip;
    }
    const ipv4Match = ip.match(/^(\d+\.\d+\.\d+)\.\d+$/);
    if (ipv4Match) {
      return `${ipv4Match[1]}.***`;
    }
    const ipv6Match = ip.match(/^[:0-9a-f]+:/i);
    if (ipv6Match) {
      return `${ipv6Match[1]}:***`;
    }
    return ip;
  }

  createSafeLogEntry(data: any, context?: string): any {
    const entry: any = { timestamp: new Date().toISOString() };
    if (context) {
      entry.context = context;
    }
    if (typeof data === 'string') {
      entry.message = this.sanitize(data);
    } else if (data instanceof Error) {
      entry.error = this.sanitizeError(data);
    } else if (typeof data === 'object') {
      Object.assign(entry, this.sanitizeObject(data));
    } else {
      entry.data = data;
    }
    return entry;
  }
}
