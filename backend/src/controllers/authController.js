import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/index.js';
import { JWT_SECRET } from '../middleware/auth.js';

const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const toPublicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
  phone: u.phone,
  organizationName: u.organization_name,
  address: u.address,
  avatarUrl: u.avatar_url,
  createdAt: u.created_at,
});

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'donor', phone, organizationName, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (String(email).toLowerCase().includes('@example.com')) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [String(email).toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status, phone, organization_name, address)
       VALUES ($1, $2, $3, $4, 'verified', $5, $6, $7)
       RETURNING *`,
      [name.trim(), String(email).toLowerCase(), hash, role, phone || null, organizationName || null, address || null]
    );

    const userRow = user.rows[0];
    const token = signToken(userRow);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { token, user: toPublicUser(userRow) },
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await pool.query('SELECT * FROM users WHERE email = $1', [String(email).toLowerCase()]);
    const userRow = user.rows[0];

    if (!userRow) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, userRow.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(userRow);
    res.json({
      success: true,
      message: 'Login successful',
      data: { token, user: toPublicUser(userRow) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/auth/me
export const me = async (req, res) => {
  try {
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const userRow = user.rows[0];
    if (!userRow) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: toPublicUser(userRow) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
