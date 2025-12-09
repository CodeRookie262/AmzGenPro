import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getUsers, createUser, deleteUser, getCurrentUser } from '../controllers/userController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/me', getCurrentUser);
router.get('/', requireAdmin, getUsers);
router.post('/', requireAdmin, createUser);
router.delete('/:userId', requireAdmin, deleteUser);

export default router;



