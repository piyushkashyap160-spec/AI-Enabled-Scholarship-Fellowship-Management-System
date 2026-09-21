import React from 'react';
import { Card, ProgressBar, Alert, Badge, Table, Button } from 'react-bootstrap';
import { FileText, CheckCircle, AlertTriangle, XCircle, Eye, Cpu } from 'lucide-react';

const OcrResultCard = ({ document: doc, onPreview = null, onViewPrevious = null }) => {
  if (!doc) return null;

  const getStatusBadge = () => {
    switch (doc.verificationStatus) {
      case 'auto_ok':
        return <Badge bg="success"><CheckCircle size={12} className="me-1" /> Auto-Verified OK</Badge>;
      case 'approved':
        return <Badge bg="success"><CheckCircle size={12} className="me-1" /> Officer Approved</Badge>;
      case 'rejected':
        return <Badge bg="danger"><XCircle size={12} className="me-1" /> Rejected / Action Required</Badge>;
      case 'needs_review':
      default:
        return <Badge bg="warning" text="dark"><AlertTriangle size={12} className="me-1" /> Needs Officer Review</Badge>;
    }
  };

  const formatKey = (key) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatVal = (val) => {
    if (typeof val === 'number') {
      if (val > 1000) return `₹${val.toLocaleString('en-IN')}`;
      return `${val}%`;
    }
    return String(val);
  };

  const hasPrevious = !!doc.previousDocId;
  const prevDoc = typeof doc.previousDocId === 'object' ? doc.previousDocId : null;

  return (
    <Card className="gov-card mb-3 border">
      <Card.Header className="d-flex justify-content-between align-items-center bg-light py-2 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <FileText className="text-primary" size={18} />
          <strong className="text-dark fs-6">{formatKey(doc.docKey)}</strong>
          <span className="text-muted small">({doc.originalName})</span>
          <Badge bg="info" text="dark" className="fw-semibold">
            v{doc.version || 1}
          </Badge>
          {hasPrevious && (
            <Badge
              bg="secondary"
              className="fw-normal"
              style={{ cursor: onViewPrevious ? 'pointer' : 'default' }}
              onClick={() => onViewPrevious && onViewPrevious(prevDoc || doc.previousDocId)}
              title="Click to view previous version"
            >
              Previous: v{(doc.version || 2) - 1} {onViewPrevious && '👁'}
            </Badge>
          )}
        </div>
        <div className="d-flex align-items-center gap-2">
          {onPreview && (
            <Button
              variant="outline-primary"
              size="sm"
              className="py-1 px-2.5 d-inline-flex align-items-center gap-1 fw-semibold"
              onClick={() => onPreview(doc)}
              title="View original uploaded document"
            >
              <Eye size={14} /> View Document
            </Button>
          )}
          {getStatusBadge()}
        </div>
      </Card.Header>

      <Card.Body className="p-3">
        {/* Re-upload Reason / Context if present */}
        {doc.reuploadReason && (
          <div className="mb-3 p-2 bg-light border-start border-3 border-info rounded-end small text-secondary">
            <strong>Re-upload Note:</strong> <em>"{doc.reuploadReason}"</em>
          </div>
        )}

        {/* Attention Alert Banner if Rejected or Has Discrepancies */}
        {doc.verificationStatus === 'rejected' && (
          <Alert variant="danger" className="py-2 px-3 mb-3 small d-flex align-items-center gap-2">
            <XCircle size={18} className="flex-shrink-0" />
            <div>
              <strong>Action Required:</strong> {doc.officerRemark || 'This document has been flagged or rejected and requires re-upload.'}
            </div>
          </Alert>
        )}
        {doc.verificationStatus !== 'rejected' && doc.mismatches && doc.mismatches.length > 0 && (
          <Alert variant="warning" className="py-2 px-3 mb-3 small d-flex align-items-center gap-2">
            <AlertTriangle size={18} className="flex-shrink-0 text-warning" />
            <div>
              <strong>⚠ Document Requires Attention:</strong> AI findings detected discrepancies that must be reviewed or confirmed.
            </div>
          </Alert>
        )}
        {/* Detected Type + two DISTINCT confidence scores. These answer
            different questions - could the text be read at all (legibility),
            vs. does the text actually match this document type (classification)
            - and are shown separately on purpose, rather than as one combined
            "OCR Confidence" figure that made a clearly-legible but unrelated
            file look confidently classified. */}
        <div className="mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2 mb-2">
            <Cpu size={16} className="text-secondary" />
            <span className="small text-muted">Detected Type:</span>
            <span className="badge bg-secondary">
              {doc.detectedDocType && doc.detectedDocType !== 'unknown' ? formatKey(doc.detectedDocType) : 'Unrecognized'}
            </span>
          </div>

          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="small text-muted text-nowrap" style={{ width: '170px' }}>Document Type Match:</span>
            <ProgressBar
              now={doc.classificationConfidence || 0}
              variant={doc.classificationConfidence >= 65 ? 'success' : (doc.classificationConfidence > 0 ? 'warning' : 'secondary')}
              label={doc.classificationConfidence > 0 ? `${doc.classificationConfidence}%` : 'N/A'}
              className="w-100"
              style={{ height: '16px', fontSize: '0.72rem', fontWeight: 'bold' }}
            />
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted text-nowrap" style={{ width: '170px' }}>OCR Legibility:</span>
            <ProgressBar
              now={doc.confidence || 0}
              variant={doc.confidence >= 80 ? 'success' : (doc.confidence >= 60 ? 'warning' : 'danger')}
              label={`${doc.confidence || 0}%`}
              className="w-100"
              style={{ height: '16px', fontSize: '0.72rem', fontWeight: 'bold' }}
            />
          </div>
        </div>

        {/* Mismatch Red Alerts */}
        {doc.mismatches && doc.mismatches.length > 0 && (
          <div className="mb-3">
            {doc.mismatches.map((m, idx) => (
              <Alert key={idx} variant={m.severity === 'critical' ? 'danger' : 'warning'} className="py-2 px-3 mb-2 small d-flex align-items-center gap-2">
                <AlertTriangle size={18} className="flex-shrink-0" />
                <div>
                  <strong>{m.severity === 'critical' ? 'Critical Discrepancy:' : 'Discrepancy Detected:'}</strong> {m.message}
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Extracted Key-Value Table */}
        <div className="mb-2">
          <div className="small fw-bold text-dark mb-1.5">AI OCR Extracted Attributes:</div>
          {doc.ocrExtracted && Object.keys(doc.ocrExtracted).length > 0 ? (
            <div className="table-responsive">
              <Table size="sm" bordered className="mb-0 bg-light small">
                <tbody>
                  {Object.entries(doc.ocrExtracted).map(([k, v]) => {
                    if (v === null || v === undefined || v === '') return null;
                    return (
                      <tr key={k}>
                        <td className="fw-semibold text-muted text-nowrap" style={{ width: '35%' }}>
                          {formatKey(k)}
                        </td>
                        <td className="fw-bold text-dark">
                          {formatVal(v)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-muted small fst-italic">No structured attributes extracted.</div>
          )}
        </div>

        {/* Officer Remark if present */}
        {doc.officerRemark && (
          <div className="mt-2 pt-2 border-top small text-secondary">
            <strong>Officer Feedback:</strong> <em>"{doc.officerRemark}"</em>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default OcrResultCard;
