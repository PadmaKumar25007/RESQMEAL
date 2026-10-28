import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 255,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['donor', 'ngo', 'volunteer', 'admin'],
      required: true,
      default: 'donor',
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'suspended'],
      default: 'verified',
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    organizationName: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
export default User;
