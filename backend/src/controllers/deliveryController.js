import { Delivery, Donation, User } from '../models/index.js';

// Get delivery tasks
export const getDeliveries = async (req, res) => {
  try {
    const { status, volunteerId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (volunteerId) filter.volunteer = volunteerId;

    const deliveries = await Delivery.find(filter)
      .populate('donation')
      .populate('volunteer', 'name phone email')
      .sort({ createdAt: -1 });

    const formatted = deliveries.map((d) => ({
      id: d._id,
      food: d.food,
      qty: d.quantity,
      from: d.from,
      to: d.to,
      distance: d.distance,
      eta: d.eta,
      urgency: d.urgency,
      status: d.status,
      pickedUpAt: d.pickedUpAt,
      deliveredAt: d.deliveredAt,
      notes: d.notes,
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single delivery task
export const getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('donation')
      .populate('volunteer', 'name phone email');

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery task not found' });
    }

    const formatted = {
      id: delivery._id,
      food: delivery.food,
      qty: delivery.quantity,
      from: delivery.from,
      to: delivery.to,
      distance: delivery.distance,
      eta: delivery.eta,
      urgency: delivery.urgency,
      status: delivery.status,
      pickedUpAt: delivery.pickedUpAt,
      deliveredAt: delivery.deliveredAt,
      notes: delivery.notes,
    };

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create / Assign delivery task
export const createDelivery = async (req, res) => {
  try {
    const { donationId, food, quantity, from, to, distance, eta, urgency } = req.body;

    let volunteerId = req.body.volunteerId;
    if (!volunteerId) {
      const defaultVolunteer = await User.findOne({ role: 'volunteer' });
      volunteerId = defaultVolunteer?._id;
    }

    const delivery = await Delivery.create({
      donation: donationId,
      volunteer: volunteerId,
      food: food || 'Food package',
      quantity: quantity || '10 meals',
      from: from || 'Pickup spot',
      to: to || 'Dropoff kitchen',
      distance: distance || '3.5 km',
      eta: eta || '18 min',
      urgency: urgency || 'Medium',
      status: 'Available',
    });

    res.status(201).json({ success: true, data: delivery });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update delivery stage (Available -> Accepted -> Picked up -> Out for delivery -> Delivered)
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { status };

    if (status === 'Picked up') {
      updateData.pickedUpAt = new Date();
    } else if (status === 'Delivered') {
      updateData.deliveredAt = new Date();
      updateData.urgency = 'Delivered';
    }

    const updated = await Delivery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    // Also update donation status if related
    if (updated.donation) {
      if (status === 'Picked up') {
        await Donation.findByIdAndUpdate(updated.donation, { status: 'picked_up' });
      } else if (status === 'Delivered') {
        await Donation.findByIdAndUpdate(updated.donation, { status: 'delivered' });
      }
    }

    res.json({ success: true, message: 'Delivery status updated', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
