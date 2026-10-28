import express from 'express';
import {
  getDonations,
  getDonationById,
  createDonation,
  updateDonationStatus,
} from '../controllers/donationController.js';

const router = express.Router();

router.route('/')
  .get(getDonations)
  .post(createDonation);

router.route('/:id')
  .get(getDonationById);

router.route('/:id/status')
  .patch(updateDonationStatus);

export default router;
