import React from 'react';
import { Check, Clock, AlertTriangle, X } from 'lucide-react';
import StatusBadge from './StatusBadge';

const canonicalStages = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'OCR_PROCESSING', label: 'AI OCR Scan' },
  { key: 'UNDER_VERIFICATION', label: 'Verification' },
  { key: 'UNDER_SCRUTINY', label: 'Officer Scrutiny' },
  { key: 'ELIGIBLE', label: 'Eligible' },
  { key: 'MERIT_LISTED', label: 'Merit List' },
  { key: 'SELECTED', label: 'Selected (Award)' },
  { key: 'DISBURSING', label: 'Disbursement' }
];

const Timeline = ({ currentStatus = 'SUBMITTED', stageHistory = [] }) => {
  // Map current stage index
  const stageKeys = canonicalStages.map(s => s.key);
  let currentIndex = stageKeys.indexOf(currentStatus);

  if (currentStatus === 'AUTO_VERIFIED') currentIndex = 2;
  if (currentStatus === 'DEFICIENT') currentIndex = 2;
  if (currentStatus === 'INELIGIBLE' || currentStatus === 'REJECTED') currentIndex = 4;
  if (currentStatus === 'WAITLISTED') currentIndex = 5;
  if (currentStatus === 'AWARD_ACCEPTED') currentIndex = 6;
  if (currentStatus === 'COMPLETED') currentIndex = 7;
  if (currentIndex === -1) currentIndex = 0;

  return (
    <div className="gov-card p-3 mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="fw-bold text-dark fs-6 d-flex align-items-center gap-2">
          <span>Application Progress Timeline</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Current Stage:</span>
          <StatusBadge status={currentStatus} />
        </div>
      </div>

      {/* Stepper */}
      <div className="timeline-stepper">
        {canonicalStages.map((stage, idx) => {
          const isCompleted = idx < currentIndex || (idx === currentIndex && ['COMPLETED', 'DISBURSING', 'SELECTED'].includes(currentStatus));
          const isActive = idx === currentIndex;
          const isDeficient = currentStatus === 'DEFICIENT' && idx === 2;
          const isRejected = (currentStatus === 'INELIGIBLE' || currentStatus === 'REJECTED') && idx === currentIndex;

          // Find timestamp in stageHistory if available
          const historyEntry = stageHistory.find(h => h.stage === stage.key || (stage.key === 'OCR_PROCESSING' && h.stage === 'AUTO_VERIFIED'));

          return (
            <div
              key={stage.key}
              className={`timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
            >
              <div className="timeline-circle">
                {isRejected ? (
                  <X size={18} className="text-danger" />
                ) : isDeficient ? (
                  <AlertTriangle size={18} className="text-warning" />
                ) : isCompleted ? (
                  <Check size={18} />
                ) : isActive ? (
                  <Clock size={18} className="text-white" />
                ) : (
                  idx + 1
                )}
              </div>
              <div className="timeline-label">{stage.label}</div>
              {historyEntry?.at && (
                <div className="timeline-date">
                  {new Date(historyEntry.at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stage History Logs & Case File Events */}
      {stageHistory.length > 0 && (
        <div className="mt-3 pt-3 border-top">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small fw-bold text-dark d-flex align-items-center gap-1">
              <span>🏛️ Application Case File (Chronological Timeline):</span>
            </span>
            <span className="badge bg-light text-secondary border">{stageHistory.length} Recorded Events</span>
          </div>

          <div className="table-responsive">
            <table className="table table-sm table-bordered gov-table small align-middle mb-2 bg-white">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '22%' }}>Date / Time</th>
                  <th style={{ width: '20%' }}>Stage / Action</th>
                  <th style={{ width: '22%' }}>Actor / Authority</th>
                  <th style={{ width: '36%' }}>Reason / Remarks</th>
                </tr>
              </thead>
              <tbody>
                {stageHistory.map((entry, idx) => (
                  <tr key={idx}>
                    <td className="text-muted">
                      {entry.at ? new Date(entry.at).toLocaleString('en-IN') : 'N/A'}
                    </td>
                    <td>
                      <StatusBadge status={entry.stage} size="sm" />
                    </td>
                    <td className="fw-semibold text-dark">
                      {entry.by || 'System'}
                    </td>
                    <td className="text-secondary">
                      {entry.remark || 'Standard stage transition completed.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;
