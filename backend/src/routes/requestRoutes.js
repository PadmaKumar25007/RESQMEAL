import express from 'express';
import { getRequests, createRequest, updateRequestStatus } from '../controllers/requestController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(getRequests)
  .post(protect, requireRole('ngo'), createRequest);

router.route('/:id/status')
  .patch(protect, requireRole('ngo', 'admin'), updateRequestStatus);

export default router;
