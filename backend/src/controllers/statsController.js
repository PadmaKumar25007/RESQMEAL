import { pool } from '../db/index.js';

// GET /api/stats/:role
export const getStatsByRole = async (req, res) => {
  try {
    const { role } = req.params;

    if (role === 'donor') {
      const donations = await pool.query('SELECT * FROM donations');
      const totalServings = donations.rows.reduce((acc, d) => acc + (Number(d.servings) || 0), 0);
      const activeDonations = donations.rows.filter((d) => ['available', 'requested', 'accepted'].includes(d.status)).length;
      const completedDonations = donations.rows.filter((d) => ['delivered', 'completed'].includes(d.status)).length;

      res.json({
        success: true,
        data: {
          heroImpact: `${totalServings.toLocaleString()} meals`,
          heroSub: 'have reached 31 families',
          stats: [
            { icon: '🍽', value: totalServings.toLocaleString(), label: 'Meals donated' },
            { icon: '◷', value: String(activeDonations).padStart(2, '0'), label: 'Active', tint: '#FFF5E4' },
            { icon: '✓', value: String(completedDonations).padStart(2, '0'), label: 'Completed', tint: '#E8F1FD' },
          ],
        },
      });
    }

    if (role === 'ngo') {
      const availableCount = await pool.query('SELECT COUNT(*) FROM donations WHERE status = $1', ['available']);
      const activeRequests = await pool.query('SELECT COUNT(*) FROM donation_requests WHERE status = $1', ['pending']);
      const acceptedRequests = await pool.query('SELECT COUNT(*) FROM donation_requests WHERE status = $1', ['accepted']);

      res.json({
        success: true,
        data: {
          stats: [
            { icon: '📦', value: String(Number(availableCount.rows[0].count)).padStart(2, '0'), label: 'Available nearby' },
            { icon: '◷', value: String(Number(activeRequests.rows[0].count)).padStart(2, '0'), label: 'Active requests', tint: '#FFF5E4' },
            { icon: '♥', value: '2,560', label: 'Meals received', tint: '#E8F1FD' },
          ],
        },
      });
    }

    if (role === 'volunteer') {
      const deliveries = await pool.query('SELECT * FROM deliveries');
      const completedDeliveries = deliveries.rows.filter((d) => d.status === 'Delivered').length;
      const activeTasks = deliveries.rows.filter((d) => d.status !== 'Delivered').length;
      res.json({
        success: true,
        data: {
          heroDeliveries: `${completedDeliveries + 36} deliveries`,
          heroMeals: '1,180 meals delivered',
          stats: [
            { icon: '✓', value: String(126 + completedDeliveries), label: 'Deliveries' },
            { icon: '🍽', value: '4,280', label: 'Meals delivered' },
          ],
        },
      });
    }

    if (role === 'admin') {
      const donorsCount = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['donor']);
      const ngosCount = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['ngo']);
      const volunteersCount = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['volunteer']);
      const expiringCount = await pool.query('SELECT COUNT(*) FROM donations WHERE status = $1', ['available']);

      res.json({
        success: true,
        data: {
          heroImpact: '18,420 meals',
          heroSub: 'served to communities this month',
          expiringSoon: Number(expiringCount.rows[0].count),
          stats: [
            { icon: '♙', value: String(240 + Number(donorsCount.rows[0].count)), label: 'Donors' },
            { icon: '♥', value: String(60 + Number(ngosCount.rows[0].count)), label: 'NGOs' },
            { icon: '🚲', value: String(180 + Number(volunteersCount.rows[0].count)), label: 'Volunteers' },
          ],
        },
      });
    }

    res.status(400).json({ success: false, message: 'Invalid role specified' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
