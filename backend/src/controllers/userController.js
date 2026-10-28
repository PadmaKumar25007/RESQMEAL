import { pool } from '../db/index.js';

// GET /api/users (admin user management)
export const getUsers = async (req, res) => {
  try {
    const { role, status, limit } = req.query;
    const conditions = [];
    const args = [];
    let sql = `SELECT * FROM users`;

    if (role) { args.push(role); conditions.push(`role = $${args.length}`); }
    if (status) { args.push(status); conditions.push(`status = $${args.length}`); }

    let finalSql = sql;
    if (conditions.length > 0) finalSql += ` WHERE ${conditions.join(' AND ')}`;
    finalSql += ` ORDER BY created_at DESC LIMIT ${Number(limit) > 0 ? Number(limit) : 100}`;

    const result = await pool.query(finalSql, args);
    const data = result.rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status === 'verified' ? 'Verified' : u.status === 'pending' ? 'Awaiting verification' : 'Suspended',
      subtitle: u.role === 'donor' ? `Donor · ${u.organization_name || 'Individual'}` : u.role === 'ngo' ? `NGO · ${u.organization_name || 'Community kitchen'}` : u.role === 'volunteer' ? `Volunteer · ${u.phone || 'Active'}` : `Admin · ${u.organization_name || 'Operations'}`,
      phone: u.phone,
      organizationName: u.organization_name,
      address: u.address,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/users/profile/:role — demo profile lookup by role
export const getProfileByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC LIMIT 1', [role]);
    const u = result.rows[0];
    if (!u) {
      return res.status(404).json({ success: false, message: `Profile for role ${role} not found` });
    }
    res.json({ success: true, data: { id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, phone: u.phone, organizationName: u.organization_name, address: u.address } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/users/:id/status
export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query('UPDATE users SET status = $2, updated_at = now() WHERE id = $1 RETURNING *', [status?.toLowerCase(), req.params.id]);
    const u = result.rows[0];
    if (!u) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User status updated', data: u });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
