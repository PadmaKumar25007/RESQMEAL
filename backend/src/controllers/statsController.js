import { User, Donation, Request, Delivery } from '../models/index.js';

export const getStatsByRole = async (req, res) => {
  try {
    const { role } = req.params;

    if (role === 'donor') {
      const totalDonations = await Donation.countDocuments();
      const activeDonations = await Donation.countDocuments({
        status: { $in: ['available', 'requested', 'accepted'] },
      });
      const completedDonations = await Donation.countDocuments({
        status: { $in: ['delivered', 'completed'] },
      });

      const donationsList = await Donation.find();
      const totalServings = donationsList.reduce((acc, d) => acc + (d.servings || 0), 0);

      return res.json({
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
      const availableCount = await Donation.countDocuments({ status: 'available' });
      const activeRequests = await Request.countDocuments({ status: 'pending' });
      const acceptedRequests = await Request.countDocuments({ status: 'accepted' });

      return res.json({
        success: true,
        data: {
          stats: [
            { icon: '📦', value: String(availableCount).padStart(2, '0'), label: 'Available nearby' },
            { icon: '◷', value: String(activeRequests).padStart(2, '0'), label: 'Active requests', tint: '#FFF5E4' },
            { icon: '♥', value: '2,560', label: 'Meals received', tint: '#E8F1FD' },
          ],
        },
      });
    }

    if (role === 'volunteer') {
      const totalDeliveries = await Delivery.countDocuments();
      const activeTasks = await Delivery.countDocuments({ status: { $ne: 'Delivered' } });
      const completedDeliveries = await Delivery.countDocuments({ status: 'Delivered' });

      return res.json({
        success: true,
        data: {
          heroDeliveries: '36 deliveries',
          heroMeals: '1,180 meals delivered',
          stats: [
            { icon: '✓', value: String(126 + completedDeliveries), label: 'Deliveries' },
            { icon: '🍽', value: '4,280', label: 'Meals delivered', tint: '#E8F1FD' },
          ],
        },
      });
    }

    if (role === 'admin') {
      const donorsCount = await User.countDocuments({ role: 'donor' });
      const ngosCount = await User.countDocuments({ role: 'ngo' });
      const volunteersCount = await User.countDocuments({ role: 'volunteer' });
      const expiringCount = await Donation.countDocuments({ status: 'available' });

      return res.json({
        success: true,
        data: {
          heroImpact: '18,420 meals',
          heroSub: 'served to communities this month',
          expiringSoon: expiringCount,
          stats: [
            { icon: '♙', value: String(240 + donorsCount), label: 'Donors' },
            { icon: '♥', value: String(60 + ngosCount), label: 'NGOs', tint: '#E8F1FD' },
            { icon: '🚲', value: String(180 + volunteersCount), label: 'Volunteers', tint: '#FFF5E4' },
          ],
        },
      });
    }

    res.status(400).json({ success: false, message: 'Invalid role specified' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
