import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
    },
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requiredQuantity: {
      type: String,
      required: true,
      trim: true,
    },
    peopleToServe: {
      type: Number,
      required: true,
      min: 1,
    },
    note: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'fulfilled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export const Request = mongoose.model('Request', requestSchema);
export default Request;
