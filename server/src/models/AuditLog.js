import mongoose from 'mongoose';
import crypto from 'crypto';

const auditLogSchema = new mongoose.Schema({
  sequenceNumber: {
    type: Number,
    index: true
  },
  previousHash: {
    type: String,
    default: 'GENESIS'
  },
  entryHash: {
    type: String,
    default: ''
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
  actorRole: {
    type: String,
    default: 'system'
  },
  action: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    required: true
  },
  entityId: {
    type: String,
    required: true
  },
  before: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  after: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  reason: {
    type: String,
    default: 'System automated action'
  },
  ip: {
    type: String,
    default: '127.0.0.1'
  },
  at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Deterministic cryptographic hash generator
auditLogSchema.methods.computeHash = function(seq, prevHash) {
  const payload = [
    seq,
    prevHash,
    this.actorId ? this.actorId.toString() : 'null',
    this.actorRole || 'system',
    this.action,
    this.entityType,
    this.entityId,
    this.reason,
    this.at ? new Date(this.at).toISOString() : ''
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
};

auditLogSchema.pre('save', async function(next) {
  if (!this.entryHash) {
    // Find the latest recorded audit log to chain hashes
    const lastLog = await this.constructor.findOne().sort({ sequenceNumber: -1, createdAt: -1 });
    const nextSeq = lastLog && typeof lastLog.sequenceNumber === 'number' ? lastLog.sequenceNumber + 1 : 1;
    const prevHash = lastLog?.entryHash || 'GENESIS';

    this.sequenceNumber = nextSeq;
    this.previousHash = prevHash;
    this.entryHash = this.computeHash(nextSeq, prevHash);
  }
  next();
});

// Verification utility to validate audit trail immutability and chain integrity
auditLogSchema.statics.verifyAuditIntegrity = async function() {
  const logs = await this.find().sort({ sequenceNumber: 1, createdAt: 1 });
  if (logs.length === 0) {
    return {
      intact: true,
      verifiedCount: 0,
      message: 'Audit log is empty. Chain intact.'
    };
  }

  let expectedPrevHash = 'GENESIS';

  for (let i = 0; i < logs.length; i++) {
    const entry = logs[i];

    // Verify backward link
    if (i === 0) {
      if (entry.previousHash !== 'GENESIS') {
        return {
          intact: false,
          verifiedCount: 0,
          brokenAtId: entry._id,
          message: `Genesis block hash mismatch: expected GENESIS, found ${entry.previousHash}`
        };
      }
    } else {
      if (entry.previousHash !== expectedPrevHash) {
        return {
          intact: false,
          verifiedCount: i,
          brokenAtId: entry._id,
          message: `Hash link broken at sequence #${entry.sequenceNumber}: previousHash does not match entry #${i}'s hash`
        };
      }
    }

    // Verify self-integrity of entry data
    const recomputedHash = entry.computeHash(entry.sequenceNumber, entry.previousHash);
    if (entry.entryHash !== recomputedHash) {
      return {
        intact: false,
        verifiedCount: i,
        brokenAtId: entry._id,
        message: `Tamper detected at sequence #${entry.sequenceNumber}: entryHash mismatch`
      };
    }

    expectedPrevHash = entry.entryHash;
  }

  return {
    intact: true,
    verifiedCount: logs.length,
    message: 'Audit chain intact. All cryptographic checksums and links verified.'
  };
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
