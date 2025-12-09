import { Response } from 'express';
import { db } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export const getMasks = async (req: AuthRequest, res: Response) => {
  try {
    // Get public masks
    const masks = await db.prepare(
      `SELECT pm.* FROM product_masks pm WHERE pm.is_public = 1 ORDER BY pm.created_at DESC`
    ).all() as any[];
    
    // Get definitions for each mask
    const masksWithDefinitions = await Promise.all(masks.map(async (mask) => {
      const definitions = await db.prepare(
        `SELECT id, name, prompt, sort_order FROM image_definitions 
         WHERE mask_id = ? ORDER BY sort_order`
      ).all(mask.id) as any[];
      
      return {
        id: mask.id,
        name: mask.name,
        promptModel: mask.prompt_model,
        definitions: definitions.map(d => ({
          id: d.id,
          name: d.name,
          prompt: d.prompt
        }))
      };
    }));
    
    res.json({ masks: masksWithDefinitions });
  } catch (error: any) {
    console.error('Get masks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createMask = async (req: AuthRequest, res: Response) => {
  try {
    const { name, promptModel, definitions = [] } = req.body;
    
    if (!name || !promptModel) {
      return res.status(400).json({ error: 'Name and promptModel are required' });
    }
    
    const maskId = uuidv4();
    
    // Create mask
    await db.prepare(
      'INSERT INTO product_masks (id, name, prompt_model, is_public, created_by) VALUES (?, ?, ?, ?, ?)'
    ).run(maskId, name, promptModel, 1, req.userId);
    
    // Create definitions
    const insertDef = db.prepare(
      'INSERT INTO image_definitions (id, mask_id, name, prompt, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    
    for (let i = 0; i < definitions.length; i++) {
      const def = definitions[i];
      const defId = uuidv4();
      await insertDef.run(defId, maskId, def.name, def.prompt, i);
    }
    
    res.status(201).json({
      message: 'Mask created successfully',
      mask: { id: maskId, name, promptModel, definitions }
    });
  } catch (error: any) {
    console.error('Create mask error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMask = async (req: AuthRequest, res: Response) => {
  try {
    const { maskId } = req.params;
    const { name, promptModel } = req.body;
    
    await db.prepare(
      'UPDATE product_masks SET name = ?, prompt_model = ?, updated_at = strftime("%s", "now") WHERE id = ?'
    ).run(name, promptModel, maskId);
    
    res.json({ message: 'Mask updated successfully' });
  } catch (error: any) {
    console.error('Update mask error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteMask = async (req: AuthRequest, res: Response) => {
  try {
    const { maskId } = req.params;
    
    await db.prepare('DELETE FROM product_masks WHERE id = ?').run(maskId);
    
    res.json({ message: 'Mask deleted successfully' });
  } catch (error: any) {
    console.error('Delete mask error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addDefinition = async (req: AuthRequest, res: Response) => {
  try {
    const { maskId } = req.params;
    const { name, prompt } = req.body;
    
    if (!name || !prompt) {
      return res.status(400).json({ error: 'Name and prompt are required' });
    }
    
    // Get max sort_order
    const maxOrder = await db.prepare(
      'SELECT MAX(sort_order) as max_order FROM image_definitions WHERE mask_id = ?'
    ).get(maskId) as any;
    
    const sortOrder = (maxOrder?.max_order ?? -1) + 1;
    const defId = uuidv4();
    
    await db.prepare(
      'INSERT INTO image_definitions (id, mask_id, name, prompt, sort_order) VALUES (?, ?, ?, ?, ?)'
    ).run(defId, maskId, name, prompt, sortOrder);
    
    res.status(201).json({
      message: 'Definition added successfully',
      definition: { id: defId, name, prompt }
    });
  } catch (error: any) {
    console.error('Add definition error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateDefinition = async (req: AuthRequest, res: Response) => {
  try {
    const { definitionId } = req.params;
    const { name, prompt } = req.body;
    
    if (!definitionId) {
      return res.status(400).json({ error: 'Definition ID is required' });
    }
    
    if (!name || !prompt) {
      return res.status(400).json({ error: 'Name and prompt are required' });
    }
    
    console.log('Updating definition:', { definitionId, name, prompt });
    
    // Use direct update method instead of SQL parsing
    const updated = await db.updateById('image_definitions', definitionId, {
      name,
      prompt,
      updated_at: Math.floor(Date.now() / 1000)
    });
    
    if (!updated) {
      return res.status(404).json({ error: 'Definition not found' });
    }
    
    // Verify the update
    const updated_def = await db.prepare('SELECT * FROM image_definitions WHERE id = ?').get(definitionId) as any;
    console.log('Updated definition:', updated_def);
    
    res.json({ message: 'Definition updated successfully' });
  } catch (error: any) {
    console.error('Update definition error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const deleteDefinition = async (req: AuthRequest, res: Response) => {
  try {
    const { definitionId } = req.params;
    
    // Use direct delete method
    const deleted = await db.deleteById('image_definitions', definitionId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Definition not found' });
    }
    
    res.json({ message: 'Definition deleted successfully' });
  } catch (error: any) {
    console.error('Delete definition error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
