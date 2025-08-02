import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

const router = Router();

// Temporarily disable all plan upgrades
router.post('/plan', authenticate, asyncHandler(async (req, res) => {
  throw new CustomError('Plan upgrades are temporarily disabled. Premium plans coming soon!', 503);
}));

router.get('/plans', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      available: ['free'],
      coming_soon: ['pro', 'team'],
      message: 'Premium plans are currently under development. Join our waitlist to be notified when they launch!'
    }
  });
}));

export default router;