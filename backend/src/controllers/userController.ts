import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await db.prepare(
      'SELECT id, name, role, avatar, created_at FROM users ORDER BY created_at DESC'
    ).all() as any[];
    
    res.json({ 
      users: users.map(u => ({
        ...u,
        createdAt: (u.created_at || 0) * 1000 || Date.now()
      }))
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, password, role = 'user' } = req.body;
    
    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }
    
    // Check if user exists
    const existing = await db.prepare('SELECT id FROM users WHERE name = ?').get(name) as any;
    
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    await db.prepare(
      'INSERT INTO users (id, name, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, name, passwordHash, role, now, now);
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: userId,
        name,
        role
      }
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Prevent deleting yourself
    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Delete user (cascade will handle related data)
    await db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.prepare(
      'SELECT id, name, role, avatar, created_at FROM users WHERE id = ?'
    ).get(req.userId) as any;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      user: {
        ...user,
        createdAt: (user.created_at || 0) * 1000 || Date.now()
      }
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
