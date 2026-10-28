import express from 'express';
import {
  getUsers,
  getProfileByRole,
  updateUserStatus,
} from '../controllers/userController.js';

const router = express.Router();

router.route('/')
  .get(getUsers);

router.route('/profile/:role')
  .get(getProfileByRole);

router.route('/:id/status')
  .patch(updateUserStatus);

export default router;
