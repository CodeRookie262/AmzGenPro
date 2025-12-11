import express from 'express';
import { authenticate } from '../middleware/auth';
import { getHistory, createHistory, deleteHistory } from '../controllers/historyController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getHistory);
router.post('/', createHistory);
router.delete('/:historyId', deleteHistory);

export default router;





