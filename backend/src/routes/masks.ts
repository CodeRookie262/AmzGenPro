import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getMasks,
  createMask,
  updateMask,
  deleteMask,
  addDefinition,
  updateDefinition,
  deleteDefinition
} from '../controllers/maskController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getMasks);
router.post('/', requireAdmin, createMask);
router.put('/:maskId', requireAdmin, updateMask);
router.delete('/:maskId', requireAdmin, deleteMask);
router.post('/:maskId/definitions', requireAdmin, addDefinition);
router.put('/definitions/:definitionId', requireAdmin, updateDefinition);
router.delete('/definitions/:definitionId', requireAdmin, deleteDefinition);

export default router;





