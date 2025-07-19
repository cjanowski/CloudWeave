import crypto from 'crypto';
import { IConfigurationEncryption } from './interfaces';

export class ConfigurationEncryption implements IConfigurationEncryption {
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly encryptionKey: Buffer;

  constructor(encryptionKey?: string) {
    if (encryptionKey) {
      this.encryptionKey = Buffer.from(encryptionKey, 'hex');
    } else {
      // Use environment variable or generate a key (for development only)
      const keyFromEnv = process.env.CONFIG_ENCRYPTION_KEY;
      if (keyFromEnv) {
        this.encryptionKey = Buffer.from(keyFromEnv, 'hex');
      } else {
        // Generate a random key for development (should be stored securely in production)
        this.encryptionKey = crypto.randomBytes(this.keyLength);
        console.warn('Using generated encryption key. Set CONFIG_ENCRYPTION_KEY environment variable for production.');
      }
    }

    if (this.encryptionKey.length !== this.keyLength) {
      throw new Error(`Encryption key must be ${this.keyLength} bytes long`);
    }
  }

  async encrypt(value: string): Promise<string> {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
      
      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Combine IV and encrypted data
      const combined = Buffer.concat([iv, Buffer.from(encrypted, 'hex')]);
      
      // Add prefix to identify encrypted values
      return `enc:${combined.toString('base64')}`;
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async decrypt(encryptedValue: string): Promise<string> {
    try {
      if (!this.isEncrypted(encryptedValue)) {
        throw new Error('Value is not encrypted');
      }

      // Remove prefix and decode
      const combined = Buffer.from(encryptedValue.slice(4), 'base64');
      
      // Extract IV and encrypted data
      const iv = combined.subarray(0, this.ivLength);
      const encrypted = combined.subarray(this.ivLength);
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isEncrypted(value: string): boolean {
    return typeof value === 'string' && value.startsWith('enc:');
  }

  // Utility method to generate a new encryption key
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Method to safely handle values that may or may not be encrypted
  async safeDecrypt(value: string): Promise<string> {
    if (this.isEncrypted(value)) {
      return this.decrypt(value);
    }
    return value;
  }

  // Method to encrypt only if not already encrypted
  async safeEncrypt(value: string): Promise<string> {
    if (this.isEncrypted(value)) {
      return value;
    }
    return this.encrypt(value);
  }
}