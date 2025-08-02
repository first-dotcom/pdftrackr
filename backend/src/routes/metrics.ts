import { Router } from 'express';
import { register } from '../middleware/metrics';

const router = Router();

// Prometheus metrics endpoint
router.get('/', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

export default router;