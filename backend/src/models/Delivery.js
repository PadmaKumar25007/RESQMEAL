import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    food: {
      type: String,
      required: true,
    },
    quantity: {
      type: String,
      required: true,
    },
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    distance: {
      type: String,
      default: '3.0 km',
    },
    eta: {
      type: String,
      default: '20 min',
    },
    urgency: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Delivered'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Available', 'Accepted', 'Picked up', 'Out for delivery', 'Delivered', 'Cancelled'],
      default: 'Available',
    },
    pickedUpAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Delivery = mongoose.model('Delivery', deliverySchema);
export default Delivery;
