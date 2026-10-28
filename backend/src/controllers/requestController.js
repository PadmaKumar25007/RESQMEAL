import { pool } from '../db/index.js';

const toPublicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  organizationName: u.organization_name,
  phone: u.phone,
  address: u.address,
});

// GET /api/requests?ngoId=&donationId=&status=
export const getRequests = async (req, res) => {
  try {
    const { ngoId, donationId, status, limit } = req.query;
    const conditions = [];
    const args = [];
    let sql = `SELECT r.*, d.food_name AS donation_food, d.quantity AS donation_qty, d.status AS donation_status, d.id AS donation_db_id,
                        u.name AS ngo_name, u.organization_name AS ngo_org
               FROM donation_requests r
               LEFT JOIN donations d ON d.id = r.donation_id
               LEFT JOIN users u ON u.id = r.ngo_id`;

    if (ngoId) { args.push(ngoId); conditions.push(`r.ngo_id = $${args.length}`); }
    if (donationId) { args.push(donationId); conditions.push(`r.donation_id = $${args.length}`); }
    if (status) { args.push(status); conditions.push(`r.status = $${args.length}`); }

    let finalSql = sql;
    if (conditions.length > 0) finalSql += ` WHERE ${conditions.join(' AND ')}`;
    finalSql += ` ORDER BY r.created_at DESC LIMIT ${Number(limit) > 0 ? Number(limit) : 100}`;

    const result = await pool.query(finalSql, args);
    const data = result.rows.map((r) => ({
      id: r.id,
      donation: r.donation_db_id ? { id: r.donation_db_id, food: r.donation_food, qty: r.donation_qty, status: r.donation_status } : null,
      ngo: { id: r.ngo_id, name: r.ngo_name, organizationName: r.ngo_org },
      requiredQuantity: r.required_quantity,
      peopleToServe: r.people_to_serve,
      note: r.note,
      status: r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Pending',
      createdAt: r.created_at,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/requests (NGO requests a donation)
export const createRequest = async (req, res) => {
  try {
    const { donationId, requiredQuantity, peopleToServe, note } = req.body;
    const ngoId = req.body.ngoId || req.user?.id;

    if (!donationId) {
      return res.status(400).json({ success: false, message: 'donationId is required' });
    }

    const donation = await pool.query('SELECT * FROM donations WHERE id = $1', [donationId]);
    const d = donation.rows[0];
    if (!d) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }
    if (d.status !== 'available') {
      return res.status(409).json({ success: false, message: `Donation is not available (status: ${d.status})` });
    }

    const ngoRequests = await pool.query(
      'SELECT id FROM donation_requests WHERE donation_id = $1 AND ngo_id = $2 AND status != $3',
      [donationId, ngoId, 'rejected']
    );
    if (ngoRequests.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'You have already requested this donation' });
    }

    const result = await pool.query(
      `INSERT INTO donation_requests (donation_id, ngo_id, required_quantity, people_to_serve, note, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [donationId, ngoId, requiredQuantity || '10 kg', Number(peopleToServe) || 30, note || null]
    );

    const request = result.rows[0];
    await pool.query(
      `UPDATE donations SET status = 'requested', claimed_by = $2, updated_at = now() WHERE id = $1`,
      [donationId, ngoId]
    );

    res.status(201).json({
      success: true,
      message: 'Request submitted successfully',
      data: {
        id: request.id,
        donation: { id: d.id, food: d.food_name, qty: d.quantity, status: 'requested' },
        ngo: { id: ngoId, name: ngoId },
        requiredQuantity: request.required_quantity,
        peopleToServe: request.people_to_serve,
        note: request.note,
        status: 'Pending',
        createdAt: request.created_at,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// PATCH /api/requests/:id/status
export const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const requestId = req.params.id;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const result = await pool.query('SELECT * FROM donation_requests WHERE id = $1', [requestId]);
    const r = result.rows[0];
    if (!r) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const updated = await pool.query(
      'UPDATE donation_requests SET status = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [status.toLowerCase(), requestId]
    );

    const updatedRequest = updated.rows[0];
    if (status === 'accepted') {
      await pool.query('UPDATE donations SET status = $1, updated_at = now() WHERE id = $2', ['accepted', r.donation_id]);
    }

    res.json({ success: true, message: 'Request status updated', data: updatedRequest });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
