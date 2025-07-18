import { authService } from './authService';
import { RegisterRequest, LoginRequest } from '../types';

describe('AuthService', () => {
  const testUser: RegisterRequest = {
    email: 'service-test@cloudweave.com',
    password: 'testpassword123',
    name: 'Service Test User',
    organizationId: 'org-service-test',
  };

  let userId: string;
  let refreshToken: string;

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await authService.register(testUser);

      expect(result.user).toMatchObject({
        email: testUser.email,
        name: testUser.name,
        organizationId: testUser.organizationId,
        isActive: true,
      });
      expect(result.tokens).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: expect.any(Number),
        tokenType: 'Bearer',
      });

      userId = result.user.id;
      refreshToken = result.tokens.refreshToken;
    });

    it('should throw error for duplicate email', async () => {
      await expect(authService.register(testUser)).rejects.toThrow('User already exists with this email');
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const credentials: LoginRequest = {
        email: testUser.email,
        password: testUser.password,
      };

      const result = await authService.login(credentials);

      expect(result.user.email).toBe(testUser.email);
      expect(result.tokens).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: expect.any(Number),
        tokenType: 'Bearer',
      });
    });

    it('should throw error for non-existent user', async () => {
      const credentials: LoginRequest = {
        email: 'nonexistent@test.com',
        password: 'password123',
      };

      await expect(authService.login(credentials)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const loginResult = await authService.login({
        email: testUser.email,
        password: testUser.password,
      });

      const payload = await authService.validateToken(loginResult.tokens.accessToken);

      expect(payload.userId).toBe(userId);
      expect(payload.organizationId).toBe(testUser.organizationId);
    });

    it('should throw error for invalid token', async () => {
      await expect(authService.validateToken('invalid-token')).rejects.toThrow('Invalid token');
    });
  });

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      const user = await authService.getUserById(userId);

      expect(user).toMatchObject({
        id: userId,
        email: testUser.email,
        name: testUser.name,
        organizationId: testUser.organizationId,
      });
    });

    it('should return null for non-existent user', async () => {
      const user = await authService.getUserById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const newTokens = await authService.refreshToken(refreshToken);

      expect(newTokens).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: expect.any(Number),
        tokenType: 'Bearer',
      });

      // Update refresh token for logout test
      refreshToken = newTokens.refreshToken;
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(authService.refreshToken('invalid-refresh-token')).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      await expect(authService.logout(refreshToken)).resolves.not.toThrow();
    });

    it('should not throw error for non-existent refresh token', async () => {
      await expect(authService.logout('non-existent-token')).resolves.not.toThrow();
    });
  });
});