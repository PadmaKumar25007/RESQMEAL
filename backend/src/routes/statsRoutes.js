import express from 'express';
import { getStatsByRole } from '../controllers/statsController.js';

const router = express.Router();

router.route('/:role')
  .get(getStatsByRole);

export default router;
