import type { User, ForgotPasswordRequest } from '../types/api';
import type { LoginCredentials, RegisterCredentials, AuthResponse } from './authService';

// Mock user database
const mockUsers: User[] = [
  {
    id: '1',
    email: 'demo@example.com',
    name: 'Demo User',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    preferences: {
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        desktop: true,
      },
      dashboard: {
        layout: 'grid',
        refreshInterval: 30000,
      },
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    lastLoginAt: '2023-01-01T00:00:00Z',
  }
];

// Mock authentication service for development
export class MockAuthService {
  private static delay(ms: number = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await this.delay(800); // Simulate network delay

    // Simple mock validation - accept any email/password combination
    const user = mockUsers.find(u => u.email === credentials.email) || {
      id: '1',
      email: credentials.email,
      name: credentials.email.split('@')[0],
      role: 'user',
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          desktop: true,
        },
        dashboard: {
          layout: 'grid',
          refreshInterval: 30000,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Generate a mock JWT token
    const token = btoa(JSON.stringify({
      userId: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    }));

    return {
      user,
      token: `mock.${token}.signature`,
      refreshToken: `refresh.${token}.signature`,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    };
  }

  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    await this.delay(1000);

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === credentials.email);
    if (existingUser) {
      throw {
        message: 'User with this email already exists',
        code: 'USER_EXISTS',
        status: 409,
      };
    }

    // Create new user
    const newUser: User = {
      id: String(mockUsers.length + 1),
      email: credentials.email,
      name: credentials.name,
      role: 'user',
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          desktop: true,
        },
        dashboard: {
          layout: 'grid',
          refreshInterval: 30000,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    // Generate token
    const token = btoa(JSON.stringify({
      userId: newUser.id,
      email: newUser.email,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    }));

    return {
      user: newUser,
      token: `mock.${token}.signature`,
      refreshToken: `refresh.${token}.signature`,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    };
  }

  static async forgotPassword(request: ForgotPasswordRequest): Promise<{ message: string }> {
    await this.delay(800);

    // Always return success for demo purposes
    return {
      message: 'Password reset email sent successfully',
    };
  }

  static async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken?: string }> {
    await this.delay(500);

    // Generate new token
    const token = btoa(JSON.stringify({
      userId: '1',
      email: 'demo@example.com',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    }));

    return {
      token: `mock.${token}.signature`,
      refreshToken: `refresh.${token}.signature`,
    };
  }

  static async logout(): Promise<void> {
    await this.delay(300);
    // Mock logout - just resolve
  }

  static async getCurrentUser(): Promise<User | null> {
    await this.delay(500);

    // Return mock user
    return mockUsers[0] || null;
  }
}