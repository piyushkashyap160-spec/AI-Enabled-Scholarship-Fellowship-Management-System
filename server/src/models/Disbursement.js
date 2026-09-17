import mongoose from 'mongoose';

const disbursementSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  installmentNo: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'released', 'held'],
    default: 'pending'
  },
  progressReportPath: {
    type: String,
    default: null
  },
  guideApproved: {
    type: Boolean,
    default: false
  },
  releasedAt: {
    type: Date,
    default: null
  },
  remarks: {
    type: String,
    default: ''
  },
  transactionId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const Disbursement = mongoose.model('Disbursement', disbursementSchema);
export default Disbursement;
