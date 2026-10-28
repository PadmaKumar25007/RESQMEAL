import express from 'express';
import { seedDatabase } from '../scripts/seed.js';

const router = express.Router();

router.post('/', async (_req, res) => {
  try {
    const result = await seedDatabase();
    res.json({
      success: true,
      message: 'Database seeded successfully',
      summary: {
        users: result.users.length,
        donations: result.donations.length,
        requests: result.requests.length,
        deliveries: result.deliveries.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
