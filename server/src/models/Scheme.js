import mongoose from 'mongoose';

const formFieldSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'number', 'date', 'select', 'textarea', 'checkbox'],
    default: 'text'
  },
  options: [{ type: String }],
  required: { type: Boolean, default: true },
  helpText: { type: String, default: '' }
}, { _id: false });

const requiredDocumentSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  acceptedTypes: [{ type: String, default: ['pdf', 'jpg', 'png'] }],
  maxAgeMonths: { type: Number, default: 0 }, // 0 = no expiry check
  ocrFields: [{ type: String }],
  required: { type: Boolean, default: true }
}, { _id: false });

const eligibilityRuleSchema = new mongoose.Schema({
  field: { type: String, required: true },
  operator: {
    type: String,
    enum: ['equals', 'notEquals', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn', 'between', 'exists'],
    required: true
  },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  message: { type: String, required: true }
}, { _id: false });

const schemeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['masters', 'phd', 'research', 'higher_secondary', 'undergraduate', 'bachelors', '10th', '12th', 'all'],
    default: 'all'
  },
  schemeType: {
    type: String,
    enum: ['Central Sector Scheme', 'Centrally Sponsored Scheme'],
    default: 'Central Sector Scheme'
  },
  benefitType: {
    type: String,
    default: 'In Cash (DBT)'
  },
  category: {
    type: String,
    default: 'National / Overseas'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  openDate: {
    type: Date,
    required: true
  },
  closeDate: {
    type: Date,
    required: true
  },
  totalSeats: {
    type: Number,
    required: true,
    default: 100
  },
  formFields: [formFieldSchema],
  requiredDocuments: [requiredDocumentSchema],
  eligibilityRules: [eligibilityRuleSchema],
  meritWeights: {
    type: mongoose.Schema.Types.Mixed,
    default: { marksPercent: 0.5, entranceScore: 0.3, interviewScore: 0.2 }
  },
  reservationQuota: {
    female: { type: Number, default: 0.30 },
    disability: { type: Number, default: 0.04 },
    pvtg: { type: Number, default: 0.05 } // Particularly Vulnerable Tribal Groups
  },
  guidelinesUrl: {
    type: String,
    default: ''
  },
  stipendAmountPerYear: {
    type: Number,
    default: 384000 // e.g. 32k/month NFST JRF
  }
}, {
  timestamps: true
});

const Scheme = mongoose.model('Scheme', schemeSchema);
export default Scheme;
