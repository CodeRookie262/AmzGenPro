import express from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import maskRoutes from './masks';
import historyRoutes from './history';
import apiKeyRoutes from './apiKeys';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/masks', maskRoutes);
router.use('/history', historyRoutes);
router.use('/api-keys', apiKeyRoutes);

export default router;



