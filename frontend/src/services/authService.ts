interface User {
  id: string
  email: string
  name: string
  role: string
  organizationId: string
  permissions: string[]
}

interface LoginResponse {
  user: User
  token: string
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    // Mock login for demo purposes
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user: {
            id: '1',
            email: email,
            name: 'Demo User',
            role: 'admin',
            organizationId: '1',
            permissions: ['read', 'write', 'admin'],
          },
          token: 'mock-jwt-token',
        })
      }, 500)
    })
  }

  async getCurrentUser(): Promise<User> {
    // Mock current user for demo purposes
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: '1',
          email: 'demo@cloudweave.com',
          name: 'Demo User',
          role: 'admin',
          organizationId: '1',
          permissions: ['read', 'write', 'admin'],
        })
      }, 300)
    })
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token')
  }
}

export const authService = new AuthService()