// Netlify Functions Auth Client - Drop-in replacement for Supabase auth

interface User {
  _id: string;
  email: string;
  role: 'admin' | 'user';
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Session {
  access_token: string;
  user: User;
}

interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
    session: Session;
  };
  error?: string;
}

interface SessionResponse {
  success: boolean;
  data: {
    session: Session | null;
  };
  error?: string;
}

class NetlifyAuth {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '/.netlify/functions';
    this.token = localStorage.getItem('auth_token');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      defaultHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    return response.json();
  }

  private setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  private clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Supabase-compatible auth methods
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const response: AuthResponse = await this.makeRequest('auth-signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success && response.data) {
        this.setToken(response.data.token);
        return { data: response.data, error: null };
      } else {
        return { data: null, error: { message: response.error || 'Sign in failed' } };
      }
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Network error' } };
    }
  }

  async signUp({ email, password, options }: { 
    email: string; 
    password: string; 
    options?: { data?: { firstName?: string; lastName?: string } } 
  }) {
    try {
      const body = {
        email,
        password,
        firstName: options?.data?.firstName,
        lastName: options?.data?.lastName,
      };

      const response: AuthResponse = await this.makeRequest('auth-signup', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (response.success && response.data) {
        this.setToken(response.data.token);
        return { data: response.data, error: null };
      } else {
        return { data: null, error: { message: response.error || 'Sign up failed' } };
      }
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Network error' } };
    }
  }

  async signOut() {
    try {
      await this.makeRequest('auth-signout', { method: 'POST' });
      this.clearToken();
      return { error: null };
    } catch (error: any) {
      this.clearToken(); // Clear token even if request fails
      return { error: { message: error.message || 'Network error' } };
    }
  }

  async getSession(): Promise<{ data: { session: Session | null }; error: any }> {
    try {
      const response: SessionResponse = await this.makeRequest('auth-session');
      
      if (response.success) {
        return { data: response.data, error: null };
      } else {
        return { data: { session: null }, error: { message: response.error } };
      }
    } catch (error: any) {
      return { data: { session: null }, error: { message: error.message || 'Network error' } };
    }
  }

  async getUser() {
    try {
      const response = await this.makeRequest('auth-me');
      
      if (response.success) {
        return { data: { user: response.data.user }, error: null };
      } else {
        return { data: { user: null }, error: { message: response.error } };
      }
    } catch (error: any) {
      return { data: { user: null }, error: { message: error.message || 'Network error' } };
    }
  }

  async resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
    try {
      const response = await this.makeRequest('auth-reset-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (response.success) {
        return { error: null };
      } else {
        return { error: { message: response.error || 'Password reset failed' } };
      }
    } catch (error: any) {
      return { error: { message: error.message || 'Network error' } };
    }
  }

  async updateUser({ password }: { password: string }) {
    // TODO: Implement password update function
    console.warn('updateUser not yet implemented for Netlify Functions');
    return { error: { message: 'Password update not yet implemented' } };
  }

  async confirmPasswordReset(token: string, password: string) {
    try {
      const response = await this.makeRequest('auth-reset-password-confirm', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });

      if (response.success) {
        return { error: null };
      } else {
        return { error: { message: response.error || 'Password reset failed' } };
      }
    } catch (error: any) {
      return { error: { message: error.message || 'Network error' } };
    }
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    // Simplified auth state change - check session on page load
    this.getSession().then(({ data }) => {
      if (data.session) {
        callback('SIGNED_IN', data.session);
      } else {
        callback('SIGNED_OUT', null);
      }
    });

    // Listen for storage changes (for multi-tab support)
    window.addEventListener('storage', (e) => {
      if (e.key === 'auth_token') {
        if (e.newValue) {
          this.token = e.newValue;
          this.getSession().then(({ data }) => {
            callback('SIGNED_IN', data.session);
          });
        } else {
          this.token = null;
          callback('SIGNED_OUT', null);
        }
      }
    });

    // Return unsubscribe function
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            // In a real implementation, you'd clean up listeners here
          }
        }
      }
    };
  }
}

// Create singleton instance
const netlifyAuth = new NetlifyAuth();

// Export Supabase-compatible interface
export const supabase = {
  auth: netlifyAuth
};

export default netlifyAuth;