import { Response } from 'express';
import { db } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export const getApiKeys = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Getting API keys for user:', req.userId);
    
    // Get admin's API keys (shared globally)
    // All users use the admin's API keys, not their own
    const keys = await db.prepare(
      `SELECT id, google_api_key, openrouter_api_key FROM api_keys 
       WHERE user_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)`
    ).get() as any;
    
    console.log('Retrieved admin keys:', keys);
    
    if (!keys) {
      console.log('No keys found, returning empty');
      return res.json({
        google: '',
        openRouter: ''
      });
    }
    
    const response = {
      google: keys.google_api_key || '',
      openRouter: keys.openrouter_api_key || ''
    };
    
    console.log('Returning keys:', { 
      google: response.google ? `${response.google.substring(0, 10)}...` : 'EMPTY', 
      openRouter: response.openRouter ? `${response.openRouter.substring(0, 10)}...` : 'EMPTY' 
    });
    
    res.json(response);
  } catch (error: any) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateApiKeys = async (req: AuthRequest, res: Response) => {
  try {
    const { google, openRouter } = req.body;
    
    // Only admin can update API keys
    const user = await db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId) as any;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can update API keys' });
    }
    
    console.log('Updating API keys by admin:', req.userId);
    console.log('Keys:', { google: google ? 'SET' : 'EMPTY', openRouter: openRouter ? 'SET' : 'EMPTY' });
    
    // Check if admin's record exists
    const existing = await db.prepare(
      'SELECT id FROM api_keys WHERE user_id = ?'
    ).get(req.userId) as any;
    
    if (!existing) {
      // Create new record for admin
      const keyId = uuidv4();
      await db.insert('api_keys', {
        id: keyId,
        user_id: req.userId,
        google_api_key: google || null,
        openrouter_api_key: openRouter || null,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000)
      });
      console.log('Created new API keys record');
    } else {
      // Update existing record using direct method
      await db.updateById('api_keys', existing.id, {
        google_api_key: google || null,
        openrouter_api_key: openRouter || null,
        updated_at: Math.floor(Date.now() / 1000)
      });
      console.log('Updated existing API keys record');
    }
    
    res.json({ message: 'API keys updated successfully' });
  } catch (error: any) {
    console.error('Update API keys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
