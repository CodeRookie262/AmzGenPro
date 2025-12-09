
import { ProductMask, ModelType, ImageDefinition, User, UserRole, UserList, GeneratedImageResult } from '../types';

// Storage Keys
const PUBLIC_MASKS_KEY = 'amazongen_public_masks'; // Admin-managed public masks
const API_KEYS_STORAGE_KEY = 'amazongen_api_keys';
const USERS_LIST_KEY = 'amazongen_users';
const CURRENT_USER_KEY = 'amazongen_current_user';

// User-specific storage keys (prefix pattern)
const getUserMasksKey = (userId: string) => `amazongen_user_${userId}_masks`;
const getUserHistoryKey = (userId: string) => `amazongen_user_${userId}_history`;

export interface ApiKeys {
  google: string;
  openRouter: string;
}

const DEFAULT_PUBLIC_MASKS: ProductMask[] = [
  {
    id: 'default-1',
    name: '通用产品 - 标准套图',
    promptModel: ModelType.GEMINI_FLASH, 
    definitions: [
      {
        id: 'def-1',
        name: '白底主图',
        prompt: '专业电商白底图，展示产品全貌，光影自然。'
      },
      {
        id: 'def-2',
        name: '生活场景 - 桌面展示',
        prompt: '放置在温馨明亮的木质桌面上，背景有绿植，生活化场景。'
      }
    ]
  }
];

// --- User Management ---

export const getCurrentUser = (): User | null => {
  try {
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) return null;
    const userList = getUserList();
    return userList.users.find(u => u.id === userId) || null;
  } catch (e) {
    console.error("Failed to get current user", e);
    return null;
  }
};

export const setCurrentUser = (userId: string | null): void => {
  try {
    if (userId) {
      localStorage.setItem(CURRENT_USER_KEY, userId);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error("Failed to set current user", e);
  }
};

export const getUserList = (): UserList => {
  try {
    const stored = localStorage.getItem(USERS_LIST_KEY);
    if (!stored) {
      // Initialize with default admin user (default password: admin)
      const defaultAdmin: User = {
        id: 'admin-001',
        name: 'admin', // Use English username for login
        password: 'admin', // Default admin password
        role: UserRole.ADMIN,
        avatar: '👑',
        createdAt: Date.now()
      };
      const initialList: UserList = {
        users: [defaultAdmin],
        currentUserId: null
      };
      saveUserList(initialList);
      console.log('Initialized default admin user');
      return initialList;
    }
    
    let userList: UserList;
    try {
      userList = JSON.parse(stored);
    } catch (parseError) {
      console.error('Failed to parse user list, reinitializing:', parseError);
      // If parse fails, reinitialize
      const defaultAdmin: User = {
        id: 'admin-001',
        name: 'admin',
        password: 'admin',
        role: UserRole.ADMIN,
        avatar: '👑',
        createdAt: Date.now()
      };
      const initialList: UserList = {
        users: [defaultAdmin],
        currentUserId: null
      };
      saveUserList(initialList);
      return initialList;
    }
    
    // Ensure users array exists
    if (!userList.users || !Array.isArray(userList.users)) {
      console.warn('Invalid user list structure, reinitializing');
      userList.users = [];
    }
    
    // Migration: Update old Chinese admin username to English
    const adminUser = userList.users.find((u: User) => u.id === 'admin-001' || (u.name === '管理员' && u.role === UserRole.ADMIN));
    if (adminUser && adminUser.name === '管理员') {
      console.log('Migrating admin username from Chinese to English');
      adminUser.name = 'admin';
      saveUserList(userList);
    }
    
    // Ensure default admin exists
    if (userList.users.length === 0 || !userList.users.some((u: User) => u.role === UserRole.ADMIN)) {
      console.log('No admin user found, creating default admin');
      const defaultAdmin: User = {
        id: 'admin-001',
        name: 'admin',
        password: 'admin',
        role: UserRole.ADMIN,
        avatar: '👑',
        createdAt: Date.now()
      };
      // Remove any existing admin-001 to avoid duplicates
      userList.users = userList.users.filter((u: User) => u.id !== 'admin-001');
      userList.users.push(defaultAdmin);
      saveUserList(userList);
    }
    
    return userList;
  } catch (e) {
    console.error("Failed to load user list", e);
    // Return default admin on error
    const defaultAdmin: User = {
      id: 'admin-001',
      name: 'admin',
      password: 'admin',
      role: UserRole.ADMIN,
      avatar: '👑',
      createdAt: Date.now()
    };
    return { users: [defaultAdmin], currentUserId: null };
  }
};

export const saveUserList = (userList: UserList): void => {
  try {
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(userList));
  } catch (e) {
    console.error("Failed to save user list", e);
  }
};

export const createUser = (name: string, password: string, role: UserRole = UserRole.USER, avatar?: string): User => {
  return {
    id: crypto.randomUUID(),
    name,
    password, // Store password (in production, should be hashed)
    role,
    avatar: avatar || '👤',
    createdAt: Date.now()
  };
};

export const addUser = (user: User): void => {
  const userList = getUserList();
  userList.users.push(user);
  saveUserList(userList);
};

export const deleteUser = (userId: string): void => {
  const userList = getUserList();
  userList.users = userList.users.filter(u => u.id !== userId);
  // Clean up user-specific data
  localStorage.removeItem(getUserMasksKey(userId));
  localStorage.removeItem(getUserHistoryKey(userId));
  saveUserList(userList);
};

// Find user by username and password
export const authenticateUser = (username: string, password: string): User | null => {
  try {
    const userList = getUserList();
    // Ensure users array exists
    if (!userList || !userList.users || userList.users.length === 0) {
      console.warn('No users found, initializing default admin');
      // Force re-initialization
      const defaultAdmin: User = {
        id: 'admin-001',
        name: 'admin',
        password: 'admin',
        role: UserRole.ADMIN,
        avatar: '👑',
        createdAt: Date.now()
      };
      const initialList: UserList = {
        users: [defaultAdmin],
        currentUserId: null
      };
      saveUserList(initialList);
      // Try login again
      if (username === 'admin' && password === 'admin') {
        return defaultAdmin;
      }
      return null;
    }
    
    // Debug log
    console.log('Authenticating user:', username, 'Available users:', userList.users.map(u => u.name));
    
    const user = userList.users.find(u => u.name === username && u.password === password);
    if (!user) {
      console.warn('User not found or password incorrect:', username);
    }
    return user || null;
  } catch (e) {
    console.error('Authentication error:', e);
    return null;
  }
};

// --- Public Masks (Admin-managed, shared by all users) ---

export const getPublicMasks = (): ProductMask[] => {
  try {
    const stored = localStorage.getItem(PUBLIC_MASKS_KEY);
    if (!stored) {
      // Initialize with default masks
      savePublicMasks(DEFAULT_PUBLIC_MASKS);
      return DEFAULT_PUBLIC_MASKS;
    }
    const parsed = JSON.parse(stored);
    return parsed.map((m: any) => ({
        ...m,
        promptModel: m.promptModel || m.model || ModelType.GEMINI_FLASH
    }));
  } catch (e) {
    console.error("Failed to load public masks", e);
    return DEFAULT_PUBLIC_MASKS;
  }
};

export const savePublicMasks = (masks: ProductMask[]): void => {
  try {
    localStorage.setItem(PUBLIC_MASKS_KEY, JSON.stringify(masks));
  } catch (e) {
    console.error("Failed to save public masks", e);
  }
};

// --- User Masks (Private masks for specific user) ---

export const getUserMasks = (userId: string): ProductMask[] => {
  try {
    const stored = localStorage.getItem(getUserMasksKey(userId));
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error(`Failed to load masks for user ${userId}`, e);
    return [];
  }
};

export const saveUserMasks = (userId: string, masks: ProductMask[]): void => {
  try {
    localStorage.setItem(getUserMasksKey(userId), JSON.stringify(masks));
  } catch (e) {
    console.error(`Failed to save masks for user ${userId}`, e);
  }
};

// --- Combined Masks (Public + User's private masks) ---

export const getMasks = (userId?: string): ProductMask[] => {
  const publicMasks = getPublicMasks();
  if (!userId) return publicMasks;
  const userMasks = getUserMasks(userId);
  return [...publicMasks, ...userMasks];
};

// Legacy support: saveMasks now saves to public masks (admin only)
export const saveMasks = (masks: ProductMask[]): void => {
  savePublicMasks(masks);
};

// --- User History (Generation Results) ---

export const getUserHistory = (userId: string): GeneratedImageResult[] => {
  try {
    const stored = localStorage.getItem(getUserHistoryKey(userId));
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error(`Failed to load history for user ${userId}`, e);
    return [];
  }
};

export const saveUserHistory = (userId: string, history: GeneratedImageResult[]): void => {
  try {
    localStorage.setItem(getUserHistoryKey(userId), JSON.stringify(history));
  } catch (e) {
    console.error(`Failed to save history for user ${userId}`, e);
  }
};

export const createMask = (name: string, promptModel: ModelType = ModelType.GEMINI_FLASH): ProductMask => {
  return {
    id: crypto.randomUUID(),
    name,
    promptModel,
    definitions: []
  };
};

export const createImageDefinition = (name: string, prompt: string): ImageDefinition => {
  return {
    id: crypto.randomUUID(),
    name,
    prompt
  };
};

// --- API Keys ---

export const getApiKeys = (): ApiKeys => {
  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (!stored) return { google: '', openRouter: '' };
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load API keys", e);
    return { google: '', openRouter: '' };
  }
};

export const saveApiKeys = (keys: ApiKeys): void => {
  try {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch (e) {
    console.error("Failed to save API keys", e);
  }
};
