import express from 'express';
import {
  getDonations,
  getDonationById,
  createDonation,
  updateDonationStatus,
} from '../controllers/donationController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(getDonations)
  .post(protect, requireRole('donor'), createDonation);

router.route('/:id')
  .get(getDonationById);

router.route('/:id/status')
  .patch(protect, requireRole('donor', 'ngo', 'admin'), updateDonationStatus);

export default router;
