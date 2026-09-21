import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import StatusBadge from '../../components/StatusBadge';
import OcrResultCard from '../../components/OcrResultCard';
import DocumentPreviewModal from '../../components/DocumentPreviewModal';
import { ShieldCheck, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, FileText, Cpu, History, Eye } from 'lucide-react';

const ReviewApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleOpenPreview = (doc) => {
    setPreviewDoc(doc);
    setShowPreviewModal(true);
  };

  // Deficiency & Rejection Modal State
  const [showDeficiencyModal, setShowDeficiencyModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedDocKey, setSelectedDocKey] = useState('');
  const [deficiencyReason, setDeficiencyReason] = useState('');
  const [deficiencyDueDays, setDeficiencyDueDays] = useState(7);

  const fetchDetails = async () => {
    try {
      const res = await axiosClient.get(`/applications/${id}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (e) {
      setErrorMsg('Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleOpenRejectModal = (doc) => {
    setSelectedDoc(doc);
    setSelectedDocKey(doc.docKey);
    // Suggest first critical mismatch if available
    const critical = doc.mismatches?.find(m => m.severity === 'critical');
    setDeficiencyReason(critical ? critical.message : (doc.officerRemark || ''));
    setShowDeficiencyModal(true);
  };

  const handleDocDecision = async (docId, decision) => {
    if (decision === 'rejected') {
      const targetDoc = documents.find(d => d._id === docId);
      if (targetDoc) {
        handleOpenRejectModal(targetDoc);
        return;
      }
    }

    setActionLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const remark = 'Document verified and approved by Verifier.';

    try {
      const res = await axiosClient.post(`/verifier/documents/${docId}/decision`, {
        decision,
        remark
      });

      if (res.data.success) {
        setSuccessMsg(`Document marked as ${decision}.`);
        fetchDetails();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update document decision.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseDeficiency = async (e) => {
    e.preventDefault();
    if (!selectedDocKey || !deficiencyReason.trim()) return;

    setActionLoading(true);
    try {
      let res;
      if (selectedDoc?._id) {
        res = await axiosClient.post(`/verifier/documents/${selectedDoc._id}/decision`, {
          decision: 'rejected',
          remark: deficiencyReason,
          dueDays: Number(deficiencyDueDays)
        });
      } else {
        res = await axiosClient.post(`/verifier/applications/${id}/deficiency`, {
          docKey: selectedDocKey,
          reason: deficiencyReason,
          dueDays: Number(deficiencyDueDays)
        });
      }

      if (res.data.success) {
        setShowDeficiencyModal(false);
        setDeficiencyReason('');
        setSelectedDoc(null);
        setSuccessMsg('Deficiency notice dispatched to applicant and document flagged for re-upload.');
        fetchDetails();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to raise deficiency.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  const { application, documents = [], deficiencies = [] } = data || {};
  const applicant = application?.applicantId;
  const scheme = application?.schemeId;

  return (
    <Container fluid className="py-4 px-lg-4">
      <Row className="gy-4">
        <Col lg={3} md={4}>
          <Sidebar />
        </Col>

        <Col lg={9} md={8}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Link to="/verifier/queue" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1">
              <ArrowLeft size={14} /> Back to Queue
            </Link>
          </div>

          {successMsg && <Alert variant="success" className="py-2 small">{successMsg}</Alert>}
          {errorMsg && <Alert variant="danger" className="py-2 small">{errorMsg}</Alert>}

          {/* Applicant & Scheme Header */}
          <Card className="gov-card p-4 mb-4 border">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
              <div>
                <span className="badge bg-primary text-uppercase fw-bold mb-1">{scheme?.code}</span>
                <h4 className="fw-bold text-dark mb-1">{applicant?.name}</h4>
                <div className="text-muted small">
                  Application Ref: <strong className="text-primary">{application?.applicationNo}</strong> | Email: <strong>{applicant?.email}</strong> | Phone: <strong>{applicant?.phone}</strong>
                </div>
              </div>
              <div>
                <StatusBadge status={application?.status} size="lg" />
              </div>
            </div>

            {/* Profile Baseline vs Declared Grid */}
            <div className="bg-light p-3 rounded small">
              <Row className="gy-2">
                <Col md={3} xs={6}>
                  <span className="text-muted d-block">Social Category:</span>
                  <strong className="text-dark">{applicant?.profile?.category || 'ST'}</strong>
                </Col>
                <Col md={3} xs={6}>
                  <span className="text-muted d-block">Declared Family Income:</span>
                  <strong className="text-dark">₹{(application?.formData?.familyIncome || applicant?.profile?.familyIncome || 0).toLocaleString('en-IN')}</strong>
                </Col>
                <Col md={3} xs={6}>
                  <span className="text-muted d-block">Qualifying Marks:</span>
                  <strong className="text-dark">{application?.formData?.marksPercent || applicant?.profile?.education?.marksPercent || 0}%</strong>
                </Col>
                <Col md={3} xs={6}>
                  <span className="text-muted d-block">Aadhaar (Last 4):</span>
                  <strong className="text-dark">{applicant?.profile?.aadhaarLast4 || 'N/A'}</strong>
                </Col>
              </Row>
            </div>
          </Card>

          {/* Scrutiny Document Cards */}
          <div className="mb-4">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <ShieldCheck size={20} className="text-primary" />
              <span>Document Verification & Scrutiny Panel ({documents.length} Files)</span>
            </h5>

            {documents.map((doc) => (
              <Card key={doc._id} className="gov-card mb-4 border shadow-sm">
                <Card.Body className="p-3">
                  <OcrResultCard document={doc} onPreview={handleOpenPreview} />

                  {/* Verifier Action Toolbar */}
                  <div className="p-3 bg-light rounded border d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2">
                    <div className="small">
                      Verification Status: <strong className="text-uppercase">{doc.verificationStatus}</strong>
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="fw-semibold d-inline-flex align-items-center gap-1"
                        onClick={() => handleOpenPreview(doc)}
                      >
                        <Eye size={15} /> View Document
                      </Button>

                      <Button
                        variant="success"
                        size="sm"
                        className="fw-semibold d-inline-flex align-items-center gap-1"
                        onClick={() => handleDocDecision(doc._id, 'approved')}
                        disabled={actionLoading || doc.verificationStatus === 'approved'}
                      >
                        <CheckCircle2 size={15} /> Approve
                      </Button>

                      <Button
                        variant="warning"
                        size="sm"
                        className="fw-bold text-dark d-inline-flex align-items-center gap-1"
                        onClick={() => handleOpenRejectModal(doc)}
                        disabled={actionLoading}
                      >
                        <AlertTriangle size={15} /> Request Re-upload
                      </Button>

                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="fw-semibold d-inline-flex align-items-center gap-1"
                        onClick={() => handleOpenRejectModal(doc)}
                        disabled={actionLoading}
                      >
                        <XCircle size={15} /> Reject
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>

          {/* Reject / Request Re-upload Modal */}
          <Modal show={showDeficiencyModal} onHide={() => { setShowDeficiencyModal(false); setSelectedDoc(null); }} centered size="lg">
            <Modal.Header closeButton className="bg-light">
              <Modal.Title className="fs-6 fw-bold text-danger d-flex align-items-center gap-2">
                <AlertTriangle size={18} />
                <span>Reject Document & Request Re-upload</span>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Form onSubmit={handleRaiseDeficiency}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Target Document</Form.Label>
                  <Form.Control type="text" value={selectedDoc ? `${selectedDoc.docKey} (v${selectedDoc.version || 1} - ${selectedDoc.originalName || 'file'})` : selectedDocKey} disabled className="bg-light" />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Select Standard Reason (or type below):</Form.Label>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {[
                      'Wrong document uploaded',
                      'Document is unreadable or blurry',
                      'Certificate details do not match application data',
                      'Invalid or expired document',
                      'AI verification discrepancy confirmed'
                    ].map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant={deficiencyReason === preset ? 'danger' : 'outline-secondary'}
                        size="sm"
                        className="rounded-pill py-1 px-3 text-start"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setDeficiencyReason(preset)}
                      >
                        {preset}
                      </Button>
                    ))}
                  </div>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Provide specific instructions to the applicant regarding what needs to be fixed or re-uploaded..."
                    value={deficiencyReason}
                    onChange={(e) => setDeficiencyReason(e.target.value)}
                    required
                  />
                  <Form.Text className="text-muted small">
                    This remark will be sent to the applicant via in-app notification and email.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold">Resolution Grace Period (Days)</Form.Label>
                  <Form.Select
                    value={deficiencyDueDays}
                    onChange={(e) => setDeficiencyDueDays(e.target.value)}
                  >
                    <option value={7}>7 Days (Standard)</option>
                    <option value={10}>10 Days</option>
                    <option value={14}>14 Days</option>
                  </Form.Select>
                </Form.Group>

                <div className="d-flex justify-content-end gap-2">
                  <Button variant="outline-secondary" size="sm" onClick={() => { setShowDeficiencyModal(false); setSelectedDoc(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="danger" size="sm" className="fw-bold" disabled={actionLoading}>
                    {actionLoading ? <Spinner size="sm" animation="border" /> : 'Confirm Rejection & Notify Applicant'}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

          {/* Document Preview Modal */}
          <DocumentPreviewModal
            show={showPreviewModal}
            onHide={() => setShowPreviewModal(false)}
            document={previewDoc}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default ReviewApplication;
