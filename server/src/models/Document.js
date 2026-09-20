import mongoose from 'mongoose';

const mismatchSchema = new mongoose.Schema({
  field: { type: String, required: true },
  declared: { type: mongoose.Schema.Types.Mixed },
  extracted: { type: mongoose.Schema.Types.Mixed },
  severity: { type: String, enum: ['warning', 'critical'], default: 'warning' },
  message: { type: String, required: true }
}, { _id: false });

const documentSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  docKey: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  storedPath: {
    type: String,
    required: true
  },
  sha256: {
    type: String,
    default: ''
  },
  mimeType: {
    type: String,
    default: 'application/pdf'
  },
  ocrStatus: {
    type: String,
    enum: ['pending', 'done', 'failed'],
    default: 'pending'
  },
  ocrRawText: {
    type: String,
    default: ''
  },
  ocrExtracted: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  confidence: {
    type: Number,
    default: 0
  },
  detectedDocType: {
    type: String,
    default: 'unknown'
  },
  classificationConfidence: { type: Number, default: 0 },
  matchedKeywords: { type: [String], default: [] },
  mismatches: [mismatchSchema],
  verificationStatus: {
    type: String,
    enum: ['auto_ok', 'needs_review', 'approved', 'rejected'],
    default: 'needs_review'
  },
  officerRemark: {
    type: String,
    default: ''
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Document = mongoose.model('Document', documentSchema);
export default Document;
