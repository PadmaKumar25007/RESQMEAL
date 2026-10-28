import express from 'express';
import { getDeliveries, getDeliveryById, createDelivery, updateDeliveryStatus } from '../controllers/deliveryController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(getDeliveries)
  .post(protect, requireRole('volunteer'), createDelivery);

router.route('/:id')
  .get(getDeliveryById);

router.route('/:id/status')
  .patch(protect, requireRole('volunteer', 'admin'), updateDeliveryStatus);

export default router;
