import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    foodName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'Cooked meal',
    },
    quantity: {
      type: String,
      required: true,
      trim: true,
    },
    servings: {
      type: Number,
      required: true,
      min: 1,
    },
    pickupLocation: {
      type: String,
      required: true,
      trim: true,
    },
    distance: {
      type: String,
      default: '1.5 km',
    },
    preparedTime: {
      type: String,
      default: 'Prepared recently',
    },
    expiryText: {
      type: String,
      default: '3h left',
    },
    emoji: {
      type: String,
      default: '🍲',
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 4 * 60 * 60 * 1000),
    },
    status: {
      type: String,
      enum: ['available', 'requested', 'accepted', 'picked_up', 'delivered', 'completed', 'cancelled'],
      default: 'available',
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Donation = mongoose.model('Donation', donationSchema);
export default Donation;
