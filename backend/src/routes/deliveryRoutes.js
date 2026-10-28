import express from 'express';
import {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDeliveryStatus,
} from '../controllers/deliveryController.js';

const router = express.Router();

router.route('/')
  .get(getDeliveries)
  .post(createDelivery);

router.route('/:id')
  .get(getDeliveryById);

router.route('/:id/status')
  .patch(updateDeliveryStatus);

export default router;
