import express from 'express';
import {
  getRequests,
  createRequest,
  updateRequestStatus,
} from '../controllers/requestController.js';

const router = express.Router();

router.route('/')
  .get(getRequests)
  .post(createRequest);

router.route('/:id/status')
  .patch(updateRequestStatus);

export default router;
