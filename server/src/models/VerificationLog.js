import mongoose from 'mongoose';

const verificationLogSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  actorType: {
    type: String,
    enum: ['AI_OCR', 'VERIFIER', 'OFFICER', 'ADMIN', 'SYSTEM'],
    default: 'SYSTEM'
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  actorName: {
    type: String,
    default: 'System'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const VerificationLog = mongoose.model('VerificationLog', verificationLogSchema);
export default VerificationLog;
