import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    enum: ['applicant', 'verifier', 'officer', 'admin'],
    default: 'applicant'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  },
  preferredLanguage: {
    type: String,
    enum: ['en', 'hi'],
    default: 'en'
  },
  profile: {
    dob: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    category: { type: String, default: 'ST' },
    state: { type: String },
    district: { type: String },
    disability: { type: Boolean, default: false },
    disabilityPercent: { type: Number, default: 0 },
    aadhaarLast4: { type: String, maxlength: 4 },
    education: {
      level: { type: String, enum: ['12th', 'bachelors', 'masters', 'phd', 'postdoc', 'other'] },
      course: { type: String },
      university: { type: String },
      marksPercent: { type: Number },
      yearOfPassing: { type: Number }
    },
    familyIncome: { type: Number },
    bankAccount: { type: String },
    ifsc: { type: String },
    address: { type: String }
  }
}, {
  timestamps: true
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  // If not already hashed with bcrypt (starts with $2)
  if (!this.passwordHash.startsWith('$2')) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
