import { User } from '../models/index.js';

// Get all users (Admin user management)
export const getUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 });

    // Format users for frontend display
    const formatted = users.map((u) => {
      let subtitle = '';
      if (u.role === 'donor') subtitle = `Donor · ${u.organizationName || 'Individual'}`;
      else if (u.role === 'ngo') subtitle = `NGO · ${u.organizationName || 'Community kitchen'}`;
      else if (u.role === 'volunteer') subtitle = `Volunteer · ${u.phone || 'Active'}`;
      else subtitle = `Admin · ${u.organizationName || 'Operations'}`;

      return {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status === 'verified' ? 'Verified' : u.status === 'pending' ? 'Awaiting verification' : 'Suspended',
        subtitle,
        phone: u.phone,
        organizationName: u.organizationName,
        address: u.address,
      };
    });

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get default profile for current role (useful for prototype without auth)
export const getProfileByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const user = await User.findOne({ role }).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: `Profile for role ${role} not found` });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update user status (verify, suspend)
export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: status.toLowerCase() },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User status updated', data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
