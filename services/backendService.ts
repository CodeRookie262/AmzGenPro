// Backend Service - Replace localStorage with API calls
import { apiService } from './apiService';
import { User, UserRole, ProductMask, ImageDefinition, GeneratedImageResult, ApiKeys } from '../types';

// ==================== Auth Service ====================

export interface LoginResponse {
  token: string;
  user: User;
}

export const backendAuth = {
  async login(name: string, password: string): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/login', { name, password });
    apiService.setToken(response.token);
    return response;
  },

  async register(name: string, password: string, role: UserRole = UserRole.USER): Promise<User> {
    const response = await apiService.post<{ user: User }>('/auth/register', { name, password, role });
    return response.user;
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiService.get<{ user: User }>('/users/me');
      return response.user;
    } catch (error) {
      return null;
    }
  },

  logout() {
    apiService.setToken(null);
  }
};

// ==================== User Service ====================

export const backendUsers = {
  async getUsers(): Promise<User[]> {
    const response = await apiService.get<{ users: User[] }>('/users');
    return response.users;
  },

  async createUser(name: string, password: string, role: UserRole = UserRole.USER): Promise<User> {
    const response = await apiService.post<{ user: User }>('/users', { name, password, role });
    return response.user;
  },

  async deleteUser(userId: string): Promise<void> {
    await apiService.delete(`/users/${userId}`);
  }
};

// ==================== Mask Service ====================

export const backendMasks = {
  async getMasks(): Promise<ProductMask[]> {
    const response = await apiService.get<{ masks: ProductMask[] }>('/masks');
    return response.masks;
  },

  async createMask(
    name: string,
    promptModel: string,
    definitions: ImageDefinition[] = []
  ): Promise<ProductMask> {
    const response = await apiService.post<{ mask: ProductMask }>('/masks', {
      name,
      promptModel,
      definitions
    });
    return response.mask;
  },

  async updateMask(maskId: string, name: string, promptModel: string): Promise<void> {
    await apiService.put(`/masks/${maskId}`, { name, promptModel });
  },

  async deleteMask(maskId: string): Promise<void> {
    await apiService.delete(`/masks/${maskId}`);
  },

  async addDefinition(maskId: string, name: string, prompt: string): Promise<ImageDefinition> {
    const response = await apiService.post<{ definition: ImageDefinition }>(
      `/masks/${maskId}/definitions`,
      { name, prompt }
    );
    return response.definition;
  },

  async updateDefinition(definitionId: string, name: string, prompt: string): Promise<void> {
    await apiService.put(`/masks/definitions/${definitionId}`, { name, prompt });
  },

  async deleteDefinition(definitionId: string): Promise<void> {
    await apiService.delete(`/masks/definitions/${definitionId}`);
  }
};

// ==================== History Service ====================

export interface HistoryResponse {
  history: GeneratedImageResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const backendHistory = {
  async getHistory(page: number = 1, limit: number = 50): Promise<HistoryResponse> {
    const response = await apiService.get<HistoryResponse>(
      `/history?page=${page}&limit=${limit}`
    );
    return response;
  },

  async createHistory(history: Partial<GeneratedImageResult>): Promise<string> {
    const response = await apiService.post<{ historyId: string }>('/history', history);
    return response.historyId;
  },

  async deleteHistory(historyId: string): Promise<void> {
    await apiService.delete(`/history/${historyId}`);
  }
};

// ==================== API Keys Service ====================

export const backendApiKeys = {
  async getApiKeys(): Promise<ApiKeys> {
    const response = await apiService.get<ApiKeys>('/api-keys');
    return response;
  },

  async updateApiKeys(keys: ApiKeys): Promise<void> {
    await apiService.put('/api-keys', keys);
  }
};





