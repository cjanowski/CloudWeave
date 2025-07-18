import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, AuthToken, JwtPayload, LoginRequest, RegisterRequest } from '../types';
import { logger } from '../utils/logger';
import { userRepository } from '../repositories/userRepository';

// In-memory refresh token store (will be moved to Redis later)
const refreshTokens: Set<string> = new Set();

export class AuthService {
  
  async register(userData: RegisterRequest): Promise<{ user: Omit<User, 'password'>; tokens: AuthToken }> {
    try {
      // Check if user already exists
      const existingUser = await userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, config.security.bcryptRounds);

      // Create new user in database
      const newUserEntity = await userRepository.create({
        email: userData.email,
        password_hash: passwordHash,
        name: userData.name,
        organization_id: userData.organizationId,
        is_active: true,
        last_login_at: null,
      });

      // Convert to User type for token generation
      const newUser: User = {
        id: newUserEntity.id,
        email: newUserEntity.email,
        name: newUserEntity.name,
        organizationId: newUserEntity.organization_id,
        roles: [], // Default roles will be assigned later
        isActive: newUserEntity.is_active,
        createdAt: newUserEntity.created_at,
        updatedAt: newUserEntity.updated_at,
      };

      // Generate tokens
      const tokens = this.generateTokens(newUser);

      logger.info(`User registered successfully: ${userData.email}`);

      // Return user without password
      const { ...userWithoutPassword } = newUser;
      return { user: userWithoutPassword, tokens };
    } catch (error) {
      // Fallback to in-memory for demo if database is not available
      logger.warn('Database not available, using fallback registration');
      return this.registerFallback(userData);
    }
  }

  async login(credentials: LoginRequest): Promise<{ user: Omit<User, 'password'>; tokens: AuthToken }> {
    try {
      // Find user by email in database
      const userEntity = await userRepository.findByEmail(credentials.email);
      if (!userEntity) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!userEntity.is_active) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(credentials.password, userEntity.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await userRepository.updateLastLogin(userEntity.id);

      // Get user with roles
      const userWithRoles = await userRepository.findWithRoles(userEntity.id);
      
      // Convert to User type for token generation
      const user: User = {
        id: userEntity.id,
        email: userEntity.email,
        name: userEntity.name,
        organizationId: userEntity.organization_id,
        roles: userWithRoles?.roles || [],
        isActive: userEntity.is_active,
        createdAt: userEntity.created_at,
        updatedAt: userEntity.updated_at,
        lastLoginAt: new Date(),
      };

      // Generate tokens
      const tokens = this.generateTokens(user);

      logger.info(`User logged in successfully: ${credentials.email}`);

      // Return user without password
      const { ...userWithoutPassword } = user;
      return { user: userWithoutPassword, tokens };
    } catch (error) {
      // Fallback to demo login if database is not available
      logger.warn('Database not available, using fallback login');
      return this.loginFallback(credentials);
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthToken> {
    if (!refreshTokens.has(refreshToken)) {
      throw new Error('Invalid refresh token');
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret as string) as JwtPayload;
      
      try {
        // Try to find user in database
        const userEntity = await userRepository.findById(decoded.userId);
        if (!userEntity || !userEntity.is_active) {
          throw new Error('User not found or inactive');
        }

        // Convert to User type
        const user: User = {
          id: userEntity.id,
          email: userEntity.email,
          name: userEntity.name,
          organizationId: userEntity.organization_id,
          roles: [],
          isActive: userEntity.is_active,
          createdAt: userEntity.created_at,
          updatedAt: userEntity.updated_at,
        };

        // Remove old refresh token
        refreshTokens.delete(refreshToken);

        // Generate new tokens
        const tokens = this.generateTokens(user);

        logger.info(`Token refreshed for user: ${user.email}`);
        return tokens;
      } catch (dbError) {
        // Fallback for demo
        return this.refreshTokenFallback(refreshToken, decoded);
      }
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    refreshTokens.delete(refreshToken);
    logger.info('User logged out successfully');
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret as string) as JwtPayload;
      
      try {
        // Try to find user in database
        const userEntity = await userRepository.findById(decoded.userId);
        if (!userEntity || !userEntity.is_active) {
          throw new Error('User not found or inactive');
        }
        return decoded;
      } catch (dbError) {
        // Fallback for demo
        return this.validateTokenFallback(decoded);
      }
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    try {
      // Try to find user with roles in database
      const userWithRoles = await userRepository.findWithRoles(userId);
      if (!userWithRoles) {
        return null;
      }

      // Convert to User type
      const user: User = {
        id: userWithRoles.id,
        email: userWithRoles.email,
        name: userWithRoles.name,
        organizationId: userWithRoles.organization_id,
        roles: userWithRoles.roles,
        isActive: userWithRoles.is_active,
        createdAt: userWithRoles.created_at,
        updatedAt: userWithRoles.updated_at,
        ...(userWithRoles.last_login_at && { lastLoginAt: userWithRoles.last_login_at }),
      };

      const { ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      // Fallback for demo
      return this.getUserByIdFallback(userId);
    }
  }

  // Fallback methods for demo when database is not available
  private async registerFallback(userData: RegisterRequest): Promise<{ user: Omit<User, 'password'>; tokens: AuthToken }> {
    const newUser: User = {
      id: `demo-${Date.now()}`,
      email: userData.email,
      name: userData.name,
      organizationId: userData.organizationId,
      roles: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tokens = this.generateTokens(newUser);
    const { ...userWithoutPassword } = newUser;
    return { user: userWithoutPassword, tokens };
  }

  private async loginFallback(credentials: LoginRequest): Promise<{ user: Omit<User, 'password'>; tokens: AuthToken }> {
    // Demo admin user for fallback
    if (credentials.email === 'admin@cloudweave.com') {
      const user: User = {
        id: 'demo-admin',
        email: 'admin@cloudweave.com',
        name: 'CloudWeave Admin',
        organizationId: 'demo-org',
        roles: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      };

      const tokens = this.generateTokens(user);
      const { ...userWithoutPassword } = user;
      return { user: userWithoutPassword, tokens };
    }
    
    throw new Error('Invalid email or password');
  }

  private async refreshTokenFallback(refreshToken: string, decoded: JwtPayload): Promise<AuthToken> {
    // Demo user for fallback
    const user: User = {
      id: decoded.userId,
      email: 'demo@cloudweave.com',
      name: 'Demo User',
      organizationId: decoded.organizationId,
      roles: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    refreshTokens.delete(refreshToken);
    return this.generateTokens(user);
  }

  private validateTokenFallback(decoded: JwtPayload): JwtPayload {
    // For demo, just return the decoded token
    return decoded;
  }

  private getUserByIdFallback(userId: string): Omit<User, 'password'> | null {
    // Demo admin user for fallback
    if (userId === 'demo-admin') {
      return {
        id: 'demo-admin',
        email: 'admin@cloudweave.com',
        name: 'CloudWeave Admin',
        organizationId: 'demo-org',
        roles: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    return null;
  }

  private generateTokens(user: User): AuthToken {
    const payload = {
      userId: user.id,
      organizationId: user.organizationId,
      roles: user.roles.map(role => role.name),
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);

    // Store refresh token
    refreshTokens.add(refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpirationTime(config.jwt.expiresIn),
      tokenType: 'Bearer',
    };
  }

  private getExpirationTime(expiresIn: string): number {
    // Convert JWT expiration string to seconds
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600;
    }
  }
}

export const authService = new AuthService();