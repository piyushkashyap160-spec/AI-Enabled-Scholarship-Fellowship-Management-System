import mongoose from 'mongoose';

const deficiencySchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    default: null
  },
  docKey: {
    type: String,
    required: true
  },
  deficiencyType: {
    type: String,
    enum: ['ai_discrepancy', 'verifier_rejection', 'clarity_issue', 'expired_document', 'other'],
    default: 'ai_discrepancy'
  },
  reason: {
    type: String,
    required: true
  },
  raisedBy: {
    type: String,
    default: 'AI_OCR_ENGINE'
  },
  raisedAt: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'resolved'],
    default: 'open'
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  reuploadedDocId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    default: null
  }
}, {
  timestamps: true
});

const Deficiency = mongoose.model('Deficiency', deficiencySchema);
export default Deficiency;
