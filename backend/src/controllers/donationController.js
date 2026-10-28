import { pool } from '../db/index.js';

const toDonationResponse = (d) => ({
  id: d.id,
  food: d.food_name,
  qty: d.quantity,
  meals: d.servings,
  place: d.pickup_location,
  distance: d.distance || '1.5 km',
  time: d.prepared_time || 'Prepared recently',
  expiry: d.expiry_text || '3h left',
  status: d.status ? d.status.charAt(0).toUpperCase() + d.status.slice(1) : 'Available',
  emoji: d.emoji || '🍲',
  category: d.category,
  description: d.description,
  donor: d.donor,
  createdAt: d.created_at,
});

// GET /api/donations?status=&category=&donorId=
export const getDonations = async (req, res) => {
  try {
    const { status, category, donorId, limit } = req.query;
    const values = [];
    let sql = `SELECT d.*, u.name AS donor_name, u.organization_name AS donor_org
               FROM donations d
               LEFT JOIN users u ON u.id = d.donor_id`;

    const conditions = [];
    const params = [];
    if (status) { params.push(status); conditions.push(`d.status = $${params.length}`); }
    if (category) { params.push(category); conditions.push(`d.category = $${params.length}`); }
    if (donorId) { params.push(donorId); conditions.push(`d.donor_id = $${params.length}`); }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ` ORDER BY d.created_at DESC LIMIT ${Number(limit) > 0 ? Number(limit) : 100}`;

    const result = await pool.query(sql, params);
    const donations = result.rows.map((d) => ({
      ...toDonationResponse(d),
      donor: {
        id: d.donor_id,
        name: d.donor_name,
        organizationName: d.donor_org,
      },
    }));

    res.json({ success: true, count: donations.length, data: donations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/donations/:id
export const getDonationById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.name AS donor_name, u.organization_name AS donor_org
       FROM donations d
       LEFT JOIN users u ON u.id = d.donor_id
       WHERE d.id = $1`,
      [req.params.id]
    );
    const d = result.rows[0];
    if (!d) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }
    res.json({
      success: true,
      data: {
        ...toDonationResponse(d),
        donor: { id: d.donor_id, name: d.donor_name, organizationName: d.donor_org },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/donations (donor creates a donation)
export const createDonation = async (req, res) => {
  try {
    const { foodName, category, quantity, servings, pickupLocation, description, imageUrl, emoji, preparedTime, expiryText } = req.body;
    const donorId = req.body.donorId || req.user?.id;

    if (!foodName || !pickupLocation || !quantity) {
      return res.status(400).json({ success: false, message: 'foodName, quantity and pickupLocation are required' });
    }

    const result = await pool.query(
      `INSERT INTO donations (donor_id, food_name, category, quantity, servings, pickup_location, description, image_url, emoji, prepared_time, expiry_text, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'available')
       RETURNING *`,
      [
        donorId,
        foodName.trim(),
        category || 'Cooked meal',
        quantity,
        Number(servings) || 30,
        pickupLocation,
        description || null,
        imageUrl || null,
        emoji || '🍲',
        preparedTime || 'Prepared just now',
        expiryText || '4h left',
      ]
    );

    const d = result.rows[0];
    const full = await pool.query(
      `SELECT d.*, u.name AS donor_name, u.organization_name AS donor_org FROM donations d LEFT JOIN users u ON u.id = d.donor_id WHERE d.id = $1`,
      [d.id]
    );

    res.status(201).json({
      success: true,
      message: 'Donation created successfully',
      data: {
        id: full.rows[0].id,
        food: full.rows[0].food_name,
        qty: full.rows[0].quantity,
        meals: full.rows[0].servings,
        place: full.rows[0].pickup_location,
        distance: full.rows[0].distance || '1.5 km',
        time: full.rows[0].prepared_time || 'Prepared just now',
        expiry: full.rows[0].expiry_text || '4h left',
        status: full.rows[0].status ? full.rows[0].status.charAt(0).toUpperCase() + full.rows[0].status.slice(1) : 'Available',
        emoji: full.rows[0].emoji || '🍲',
        category: full.rows[0].category,
        description: full.rows[0].description,
        donor: full.rows[0].donor,
        createdAt: full.rows[0].created_at,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// PATCH /api/donations/:id/status
export const updateDonationStatus = async (req, res) => {
  try {
    const { status, claimedBy } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    const donationId = req.params.id;

    const donation = await pool.query('SELECT * FROM donations WHERE id = $1', [donationId]);
    const d = donation.rows[0];
    if (!d) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const updated = await pool.query(
      `UPDATE donations SET status = $2, claimed_by = COALESCE($3, claimed_by), updated_at = now() WHERE id = $1 RETURNING *`,
      [status.toLowerCase(), claimedBy || null, donationId]
    );

    const updatedDonation = updated.rows[0];
    const full = await pool.query(
      `SELECT d.*, u.name AS donor_name, u.organization_name AS donor_org FROM donations d LEFT JOIN users u ON u.id = d.donor_id WHERE d.id = $1`,
      [updatedDonation.id]
    );

    res.json({ success: true, message: 'Status updated', data: full.rows[0] });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
