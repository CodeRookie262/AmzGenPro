import express from 'express';
import { authenticate } from '../middleware/auth';
import { getApiKeys, updateApiKeys } from '../controllers/apiKeyController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getApiKeys);
router.put('/', updateApiKeys);

export default router;





