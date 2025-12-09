
export interface User {
  username: string;
  passwordHash: string; // Simple hash for demo
  role: 'admin' | 'user';
  createdAt: number;
}

const USERS_KEY = 'amazongen_users';
const CURRENT_USER_KEY = 'amazongen_current_user';

// Initialize with default admin if not exists
const initAuth = () => {
  const users = getUsers();
  if (users.length === 0) {
    // Default admin: admin / admin123
    const defaultAdmin: User = {
      username: 'admin',
      passwordHash: 'admin123', // In real app, use proper hashing
      role: 'admin',
      createdAt: Date.now()
    };
    saveUsers([defaultAdmin]);
  }
};

export const getUsers = (): User[] => {
  const str = localStorage.getItem(USERS_KEY);
  return str ? JSON.parse(str) : [];
};

const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const login = (username: string, password: string): User | null => {
  initAuth();
  const users = getUsers();
  const user = users.find(u => u.username === username && u.passwordHash === password);
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }
  return null;
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const str = localStorage.getItem(CURRENT_USER_KEY);
  return str ? JSON.parse(str) : null;
};

export const createUser = (username: string, password: string, role: 'admin' | 'user' = 'user'): boolean => {
  const users = getUsers();
  if (users.some(u => u.username === username)) {
    return false; // User exists
  }
  const newUser: User = {
    username,
    passwordHash: password,
    role,
    createdAt: Date.now()
  };
  saveUsers([...users, newUser]);
  return true;
};

export const deleteUser = (username: string) => {
  const users = getUsers();
  saveUsers(users.filter(u => u.username !== username));
};

