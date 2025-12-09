import { Response } from 'express';
import { db } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const history = await db.prepare(
      `SELECT * FROM generation_history 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`
    ).all(req.userId, Number(limit), offset) as any[];
    
    // Get total count
    const countResult = await db.prepare(
      'SELECT COUNT(*) as total FROM generation_history WHERE user_id = ?'
    ).get(req.userId) as any;
    
    const total = countResult?.total ?? 0;
    
    res.json({
      history: history.map(h => ({
        id: h.id,
        definitionId: h.definition_id,
        definitionName: h.definition_name,
        imageUrl: h.generated_image_url,
        sourceImage: h.source_image_url,
        optimizedPrompt: h.optimized_prompt,
        model: h.model,
        timestamp: h.created_at * 1000,
        createdAt: h.created_at * 1000,
        updatedAt: h.updated_at * 1000,
        loading: false,
        savedToBackend: true,
        historyId: h.id
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createHistory = async (req: AuthRequest, res: Response) => {
  try {
    const {
      maskId,
      definitionId,
      definitionName,
      sourceImageUrl,
      generatedImageUrl,
      prompt,
      optimizedPrompt,
      model
    } = req.body;
    
    const historyId = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    
    console.log('Creating history:', { historyId, userId: req.userId, maskId, definitionId });
    
    // Use direct insert method instead of SQL parsing
    await db.insert('generation_history', {
      id: historyId,
      user_id: req.userId,
      mask_id: maskId,
      definition_id: definitionId,
      definition_name: definitionName,
      source_image_url: sourceImageUrl,
      generated_image_url: generatedImageUrl,
      prompt: prompt,
      optimized_prompt: optimizedPrompt,
      model: model,
      status: 'completed',
      created_at: now,
      updated_at: now
    });
    
    console.log('History created successfully:', historyId);
    
    res.status(201).json({
      message: 'History created successfully',
      historyId
    });
  } catch (error: any) {
    console.error('Create history error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const deleteHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { historyId } = req.params;
    
    // Verify ownership
    const history = await db.prepare(
      'SELECT user_id FROM generation_history WHERE id = ?'
    ).get(historyId) as any;
    
    if (!history) {
      return res.status(404).json({ error: 'History not found' });
    }
    
    if (history.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Use direct delete method
    await db.deleteById('generation_history', historyId);
    
    console.log('History deleted:', historyId);
    
    res.json({ message: 'History deleted successfully' });
  } catch (error: any) {
    console.error('Delete history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
