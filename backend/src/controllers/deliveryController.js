import { pool } from '../db/index.js';

// GET /api/deliveries?status=&volunteerId=
export const getDeliveries = async (req, res) => {
  try {
    const { status, volunteerId, limit } = req.query;
    const conditions = [];
    const args = [];
    let sql = `SELECT d.*, dn.food_name AS donation_food FROM deliveries d LEFT JOIN donations dn ON dn.id = d.donation_id`;

    if (status) { args.push(status); conditions.push(`d.status = $${args.length}`); }
    if (volunteerId) { args.push(volunteerId); conditions.push(`d.volunteer_id = $${args.length}`); }

    let finalSql = sql;
    if (conditions.length > 0) finalSql += ` WHERE ${conditions.join(' AND ')}`;
    finalSql += ` ORDER BY d.created_at DESC LIMIT ${Number(limit) > 0 ? Number(limit) : 100}`;

    const result = await pool.query(finalSql, args);
    const data = result.rows.map((d) => ({
      id: d.id,
      donation: d.donation ? { id: d.donation, food: d.donation_food } : null,
      volunteerId: d.volunteer_id,
      food: d.food,
      qty: d.quantity,
      from: d.from_location,
      to: d.to_location,
      distance: d.distance,
      eta: d.eta,
      urgency: d.urgency,
      status: d.status,
      pickedUpAt: d.picked_up_at,
      deliveredAt: d.delivered_at,
      notes: d.notes,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/deliveries/:id/status
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const deliveryId = req.params.id;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const delivery = await pool.query('SELECT * FROM deliveries WHERE id = $1', [deliveryId]);
    const d = delivery.rows[0];
    if (!d) {
      return res.status(404).json({ success: false, message: 'Delivery task not found' });
    }

    const updated = await pool.query(
      `UPDATE deliveries SET status = $2, picked_up_at = CASE WHEN $2 = 'Picked up' THEN now() ELSE picked_up_at END,
       delivered_at = CASE WHEN $2 = 'Delivered' THEN now() ELSE delivered_at END, updated_at = now()
       WHERE id = $1 RETURNING *`,
      [status, deliveryId]
    );

    const updatedDelivery = updated.rows[0];
    if (status === 'Picked up') {
      await pool.query('UPDATE donations SET status = $2, updated_at = now() WHERE id = $3', ['picked_up', d.donation_id]);
    } else if (status === 'Delivered') {
      await pool.query('UPDATE donations SET status = $2, updated_at = now() WHERE id = $3', ['delivered', d.donation_id]);
    }

    res.json({ success: true, message: 'Delivery status updated', data: updatedDelivery });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const createDelivery = async (req, res) => {
  try {
    const { donationId, food, quantity, from: fromLocation, to: toLocation, distance, eta, urgency, volunteerId } = req.body;
    const result = await pool.query(
      `INSERT INTO deliveries (donation_id, volunteer_id, food, quantity, from_location, to_location, distance, eta, urgency, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Available') RETURNING *`,
      [donationId || null, volunteerId || null, food || 'Food package', quantity || '10 meals', fromLocation || 'Pickup spot', toLocation || 'Dropoff kitchen', distance || '3.5 km', eta || '18 min', urgency || 'Medium']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getDeliveryById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, dn.food_name AS donation_food FROM deliveries d LEFT JOIN donations dn ON dn.id = d.donation_id WHERE d.id = $1`,
      [req.params.id]
    );
    const d = result.rows[0];
    if (!d) {
      return res.status(404).json({ success: false, message: 'Delivery task not found' });
    }
    res.json({ success: true, data: { ...d, from: d.from_location, to: d.to_location } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
