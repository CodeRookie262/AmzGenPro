// API Service - Unified API Client
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage on init
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        this.setToken(null);
        // Redirect to login if not already there
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
        throw new Error('Unauthorized - Please login again');
      }

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || data.message || `HTTP error! status: ${response.status}`;
        console.error(`API request failed: ${response.status} ${response.statusText}`, {
          url,
          method: options.method || 'GET',
          error: errorMsg,
          data
        });
        throw new Error(errorMsg);
      }

      return data;
    } catch (error: any) {
      // If it's already our error, re-throw it
      if (error.message && error.message.includes('HTTP error')) {
        throw error;
      }
      // Network errors or JSON parse errors
      console.error('API request failed:', {
        url,
        method: options.method || 'GET',
        error: error.message || error
      });
      throw new Error(error.message || `Network error: ${error}`);
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiService = new ApiService(API_BASE_URL);

