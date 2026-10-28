import { Request, Donation, User } from '../models/index.js';

// Get requests
export const getRequests = async (req, res) => {
  try {
    const { ngoId, donationId, status } = req.query;
    const filter = {};

    if (ngoId) filter.ngo = ngoId;
    if (donationId) filter.donation = donationId;
    if (status) filter.status = status;

    const requests = await Request.find(filter)
      .populate('donation')
      .populate('ngo', 'name organizationName phone email address')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create a new request (NGO requests food)
export const createRequest = async (req, res) => {
  try {
    const { donationId, requiredQuantity, peopleToServe, note } = req.body;

    let ngoId = req.body.ngoId;
    if (!ngoId) {
      const defaultNGO = await User.findOne({ role: 'ngo' });
      ngoId = defaultNGO?._id;
    }

    const request = await Request.create({
      donation: donationId,
      ngo: ngoId,
      requiredQuantity: requiredQuantity || '10 kg',
      peopleToServe: Number(peopleToServe) || 30,
      note: note || 'Requested via ResQMeal app',
      status: 'pending',
    });

    // Update donation status to requested
    if (donationId) {
      await Donation.findByIdAndUpdate(donationId, {
        status: 'requested',
        claimedBy: ngoId,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Request submitted successfully',
      data: request,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update request status (accept, fulfill, reject)
export const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('donation');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (status === 'accepted' && updated.donation) {
      await Donation.findByIdAndUpdate(updated.donation._id, { status: 'accepted' });
    }

    res.json({ success: true, message: 'Request status updated', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
