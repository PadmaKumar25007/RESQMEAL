import express from 'express';
import { predictFood, aiHealth } from '../controllers/aiController.js';

const router = express.Router();

router.post('/predict', predictFood);
router.get('/health', aiHealth);

export default router;
