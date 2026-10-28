import express from 'express';
import { getUsers, getProfileByRole, updateUserStatus } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, requireRole('admin'), getUsers);

router.route('/profile/:role')
  .get(getProfileByRole);

router.route('/:id/status')
  .patch(protect, requireRole('admin'), updateUserStatus);

export default router;
