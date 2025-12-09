import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export const login = async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body;
    
    if (!name || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Find user
    const user = await db.prepare('SELECT * FROM users WHERE name = ?').get(name) as any;
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'amazongen-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      secret,
      { expiresIn }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.created_at * 1000 // Convert to milliseconds
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, password, role = 'user' } = req.body;
    
    if (!name || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
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
    await db.prepare(
      'INSERT INTO users (id, name, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run(userId, name, passwordHash, role);
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: userId,
        name,
        role
      }
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
