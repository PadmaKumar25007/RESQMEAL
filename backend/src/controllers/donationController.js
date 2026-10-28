import { Donation, User } from '../models/index.js';

// Get all donations with optional filters
export const getDonations = async (req, res) => {
  try {
    const { status, category, donorId } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (category) {
      filter.category = category;
    }
    if (donorId) {
      filter.donor = donorId;
    }

    const donations = await Donation.find(filter)
      .populate('donor', 'name organizationName phone email')
      .populate('claimedBy', 'name organizationName')
      .sort({ createdAt: -1 });

    // Format fields to match frontend expectation (food, qty, meals, place, etc.)
    const formatted = donations.map((d) => ({
      id: d._id,
      food: d.foodName,
      qty: d.quantity,
      meals: d.servings,
      place: d.pickupLocation,
      distance: d.distance || '1.5 km',
      time: d.preparedTime || 'Prepared recently',
      expiry: d.expiryText || '3h left',
      status: d.status.charAt(0).toUpperCase() + d.status.slice(1),
      emoji: d.emoji || '🍲',
      category: d.category,
      description: d.description,
      donor: d.donor,
      createdAt: d.createdAt,
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single donation by ID
export const getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name organizationName phone email')
      .populate('claimedBy', 'name organizationName');

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const formatted = {
      id: donation._id,
      food: donation.foodName,
      qty: donation.quantity,
      meals: donation.servings,
      place: donation.pickupLocation,
      distance: donation.distance || '1.5 km',
      time: donation.preparedTime || 'Prepared recently',
      expiry: donation.expiryText || '3h left',
      status: donation.status.charAt(0).toUpperCase() + donation.status.slice(1),
      emoji: donation.emoji || '🍲',
      category: donation.category,
      description: donation.description,
      donor: donation.donor,
      createdAt: donation.createdAt,
    };

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create new donation (Donor post food)
export const createDonation = async (req, res) => {
  try {
    const {
      foodName,
      category = 'Cooked meal',
      quantity,
      servings,
      pickupLocation,
      description,
      imageUrl,
      emoji = '🍲',
      preparedTime = 'Prepared just now',
      expiryText = '4h left',
    } = req.body;

    // Pick default donor if not specified (for testing without auth)
    let donorId = req.body.donorId;
    if (!donorId) {
      const defaultDonor = await User.findOne({ role: 'donor' });
      donorId = defaultDonor?._id;
    }

    const newDonation = await Donation.create({
      donor: donorId,
      foodName: foodName || 'Fresh Food Donation',
      category,
      quantity: quantity || '10 kg',
      servings: Number(servings) || 30,
      pickupLocation: pickupLocation || 'Community Center',
      distance: '1.2 km',
      preparedTime,
      expiryText,
      emoji,
      description,
      imageUrl,
      status: 'available',
    });

    res.status(201).json({
      success: true,
      message: 'Donation created successfully',
      data: newDonation,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update donation status
export const updateDonationStatus = async (req, res) => {
  try {
    const { status, claimedBy } = req.body;
    const updateData = { status: status.toLowerCase() };
    if (claimedBy) updateData.claimedBy = claimedBy;

    const updated = await Donation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    res.json({ success: true, message: 'Status updated', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
