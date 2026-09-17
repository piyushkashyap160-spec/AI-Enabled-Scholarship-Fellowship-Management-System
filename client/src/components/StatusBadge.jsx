import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const statusConfig = {
  DRAFT: { className: 'badge-draft', defaultText: 'Draft' },
  SUBMITTED: { className: 'badge-submitted', defaultText: 'Submitted' },
  OCR_PROCESSING: { className: 'badge-ocr-processing', defaultText: 'OCR Scanning' },
  AUTO_VERIFIED: { className: 'badge-auto-verified', defaultText: 'Auto-Verified' },
  DEFICIENT: { className: 'badge-deficient', defaultText: 'Deficient' },
  UNDER_VERIFICATION: { className: 'badge-under-verification', defaultText: 'In Verification' },
  UNDER_SCRUTINY: { className: 'badge-under-scrutiny', defaultText: 'Under Scrutiny' },
  ELIGIBLE: { className: 'badge-eligible', defaultText: 'Eligible' },
  INELIGIBLE: { className: 'badge-ineligible', defaultText: 'Ineligible' },
  MERIT_LISTED: { className: 'badge-merit-listed', defaultText: 'Merit Listed' },
  SELECTED: { className: 'badge-selected', defaultText: 'Selected (Award)' },
  WAITLISTED: { className: 'badge-waitlisted', defaultText: 'Waitlisted' },
  REJECTED: { className: 'badge-rejected', defaultText: 'Rejected' },
  AWARD_ACCEPTED: { className: 'badge-award-accepted', defaultText: 'Award Accepted' },
  DISBURSING: { className: 'badge-disbursing', defaultText: 'Disbursing' },
  COMPLETED: { className: 'badge-completed', defaultText: 'Completed' }
};

const StatusBadge = ({ status = 'DRAFT', className = '', size = 'md' }) => {
  const { t } = useLanguage();
  const config = statusConfig[status] || { className: 'badge-draft', defaultText: status };
  const localizedLabel = t(`status.${status}`, config.defaultText);

  const paddingClass = size === 'sm' ? 'px-2 py-0.5' : (size === 'lg' ? 'px-3 py-1.5 fs-6' : 'px-2.5 py-1');

  return (
    <span
      className={`badge rounded-pill fw-semibold ${config.className} ${paddingClass} ${className}`}
      style={{ letterSpacing: '0.3px', fontSize: size === 'sm' ? '0.72rem' : undefined }}
    >
      {localizedLabel}
    </span>
  );
};

export default StatusBadge;
