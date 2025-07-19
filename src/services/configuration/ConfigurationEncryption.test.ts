import { ConfigurationEncryption } from './ConfigurationEncryption';

describe('ConfigurationEncryption', () => {
  let encryption: ConfigurationEncryption;
  const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  beforeEach(() => {
    encryption = new ConfigurationEncryption(testKey);
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a string successfully', async () => {
      const originalValue = 'secret-password-123';
      
      const encrypted = await encryption.encrypt(originalValue);
      expect(encrypted).toMatch(/^enc:/);
      expect(encrypted).not.toBe(originalValue);
      
      const decrypted = await encryption.decrypt(encrypted);
      expect(decrypted).toBe(originalValue);
    });

    it('should encrypt different values to different ciphertexts', async () => {
      const value1 = 'secret1';
      const value2 = 'secret2';
      
      const encrypted1 = await encryption.encrypt(value1);
      const encrypted2 = await encryption.encrypt(value2);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should encrypt the same value to different ciphertexts (due to random IV)', async () => {
      const value = 'same-secret';
      
      const encrypted1 = await encryption.encrypt(value);
      const encrypted2 = await encryption.encrypt(value);
      
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to the same value
      const decrypted1 = await encryption.decrypt(encrypted1);
      const decrypted2 = await encryption.decrypt(encrypted2);
      
      expect(decrypted1).toBe(value);
      expect(decrypted2).toBe(value);
    });

    it('should handle empty strings', async () => {
      const originalValue = '';
      
      const encrypted = await encryption.encrypt(originalValue);
      const decrypted = await encryption.decrypt(encrypted);
      
      expect(decrypted).toBe(originalValue);
    });

    it('should handle special characters and unicode', async () => {
      const originalValue = 'Special chars: !@#$%^&*()_+ 🔐 Unicode: ñáéíóú';
      
      const encrypted = await encryption.encrypt(originalValue);
      const decrypted = await encryption.decrypt(encrypted);
      
      expect(decrypted).toBe(originalValue);
    });

    it('should throw error when decrypting invalid data', async () => {
      await expect(encryption.decrypt('enc:invalid-base64'))
        .rejects.toThrow('Decryption failed');
      
      await expect(encryption.decrypt('not-encrypted'))
        .rejects.toThrow('Value is not encrypted');
    });
  });

  describe('isEncrypted', () => {
    it('should identify encrypted values', async () => {
      const encrypted = await encryption.encrypt('test');
      
      expect(encryption.isEncrypted(encrypted)).toBe(true);
      expect(encryption.isEncrypted('plain-text')).toBe(false);
      expect(encryption.isEncrypted('enc:but-invalid')).toBe(true); // Still has prefix
    });

    it('should handle non-string values', () => {
      expect(encryption.isEncrypted(123 as any)).toBe(false);
      expect(encryption.isEncrypted(null as any)).toBe(false);
      expect(encryption.isEncrypted(undefined as any)).toBe(false);
    });
  });

  describe('safeDecrypt', () => {
    it('should decrypt encrypted values', async () => {
      const originalValue = 'secret';
      const encrypted = await encryption.encrypt(originalValue);
      
      const result = await encryption.safeDecrypt(encrypted);
      expect(result).toBe(originalValue);
    });

    it('should return plain text values unchanged', async () => {
      const plainValue = 'not-encrypted';
      
      const result = await encryption.safeDecrypt(plainValue);
      expect(result).toBe(plainValue);
    });
  });

  describe('safeEncrypt', () => {
    it('should encrypt plain text values', async () => {
      const plainValue = 'secret';
      
      const result = await encryption.safeEncrypt(plainValue);
      expect(result).toMatch(/^enc:/);
      expect(result).not.toBe(plainValue);
    });

    it('should return encrypted values unchanged', async () => {
      const originalValue = 'secret';
      const encrypted = await encryption.encrypt(originalValue);
      
      const result = await encryption.safeEncrypt(encrypted);
      expect(result).toBe(encrypted);
    });
  });

  describe('constructor', () => {
    it('should throw error for invalid key length', () => {
      expect(() => new ConfigurationEncryption('short-key'))
        .toThrow('Encryption key must be 32 bytes long');
    });

    it('should work with environment variable', () => {
      const originalEnv = process.env.CONFIG_ENCRYPTION_KEY;
      process.env.CONFIG_ENCRYPTION_KEY = testKey;
      
      expect(() => new ConfigurationEncryption()).not.toThrow();
      
      // Restore original environment
      if (originalEnv) {
        process.env.CONFIG_ENCRYPTION_KEY = originalEnv;
      } else {
        delete process.env.CONFIG_ENCRYPTION_KEY;
      }
    });
  });

  describe('generateKey', () => {
    it('should generate a valid key', () => {
      const key = ConfigurationEncryption.generateKey();
      
      expect(key).toHaveLength(64); // 32 bytes in hex = 64 characters
      expect(key).toMatch(/^[0-9a-f]+$/); // Only hex characters
      
      // Should be able to create encryption instance with generated key
      expect(() => new ConfigurationEncryption(key)).not.toThrow();
    });

    it('should generate different keys each time', () => {
      const key1 = ConfigurationEncryption.generateKey();
      const key2 = ConfigurationEncryption.generateKey();
      
      expect(key1).not.toBe(key2);
    });
  });
});