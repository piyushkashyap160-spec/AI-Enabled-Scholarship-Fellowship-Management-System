import React from 'react';
import { Card, ProgressBar, Alert, Badge, Table } from 'react-bootstrap';
import { FileText, CheckCircle, AlertTriangle, XCircle, Eye, Cpu } from 'lucide-react';

const OcrResultCard = ({ document: doc, onPreview = null }) => {
  if (!doc) return null;

  const getStatusBadge = () => {
    switch (doc.verificationStatus) {
      case 'auto_ok':
        return <Badge bg="success"><CheckCircle size={12} className="me-1" /> Auto-Verified OK</Badge>;
      case 'approved':
        return <Badge bg="success"><CheckCircle size={12} className="me-1" /> Officer Approved</Badge>;
      case 'rejected':
        return <Badge bg="danger"><XCircle size={12} className="me-1" /> Rejected</Badge>;
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

  return (
    <Card className="gov-card mb-3 border">
      <Card.Header className="d-flex justify-content-between align-items-center bg-light py-2">
        <div className="d-flex align-items-center gap-2">
          <FileText className="text-primary" size={18} />
          <strong className="text-dark fs-6">{formatKey(doc.docKey)}</strong>
          <span className="text-muted small">({doc.originalName})</span>
        </div>
        <div>
          {getStatusBadge()}
        </div>
      </Card.Header>

      <Card.Body className="p-3">
        {/* OCR Confidence & Classification */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <Cpu size={16} className="text-secondary" />
            <span className="small text-muted">Detected Type:</span>
            <span className="badge bg-secondary">{formatKey(doc.detectedDocType || 'unknown')}</span>
          </div>

          <div className="d-flex align-items-center gap-2" style={{ width: '220px' }}>
            <span className="small text-muted text-nowrap">OCR Confidence:</span>
            <ProgressBar
              now={doc.confidence || 0}
              variant={doc.confidence >= 80 ? 'success' : (doc.confidence >= 60 ? 'warning' : 'danger')}
              label={`${doc.confidence || 0}%`}
              className="w-100"
              style={{ height: '18px', fontSize: '0.75rem', fontWeight: 'bold' }}
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
