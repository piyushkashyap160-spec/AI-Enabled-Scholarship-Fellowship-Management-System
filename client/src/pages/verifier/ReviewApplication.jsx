import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import StatusBadge from '../../components/StatusBadge';
import OcrResultCard from '../../components/OcrResultCard';
import { ShieldCheck, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, FileText, Cpu, History } from 'lucide-react';

const ReviewApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Deficiency Modal State
  const [showDeficiencyModal, setShowDeficiencyModal] = useState(false);
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

  const handleDocDecision = async (docId, decision) => {
    setActionLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const remark = decision === 'approved'
      ? 'Document verified and approved by Verifier.'
      : 'Document rejected due to discrepancies in OCR verification.';

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
      const res = await axiosClient.post(`/verifier/applications/${id}/deficiency`, {
        docKey: selectedDocKey,
        reason: deficiencyReason,
        dueDays: Number(deficiencyDueDays)
      });

      if (res.data.success) {
        setShowDeficiencyModal(false);
        setDeficiencyReason('');
        setSuccessMsg('Deficiency raised and notification dispatched to applicant.');
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
                  <OcrResultCard document={doc} />

                  {/* Verifier Action Toolbar */}
                  <div className="p-3 bg-light rounded border d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2">
                    <div className="small">
                      Verification Status: <strong className="text-uppercase">{doc.verificationStatus}</strong>
                    </div>

                    <div className="d-flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        className="fw-semibold d-inline-flex align-items-center gap-1"
                        onClick={() => handleDocDecision(doc._id, 'approved')}
                        disabled={actionLoading}
                      >
                        <CheckCircle2 size={15} /> Approve Document
                      </Button>

                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="fw-semibold d-inline-flex align-items-center gap-1"
                        onClick={() => handleDocDecision(doc._id, 'rejected')}
                        disabled={actionLoading}
                      >
                        <XCircle size={15} /> Reject
                      </Button>

                      <Button
                        variant="warning"
                        size="sm"
                        className="fw-bold text-dark d-inline-flex align-items-center gap-1"
                        onClick={() => {
                          setSelectedDocKey(doc.docKey);
                          setShowDeficiencyModal(true);
                        }}
                        disabled={actionLoading}
                      >
                        <AlertTriangle size={15} /> Raise Deficiency
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>

          {/* Raise Deficiency Modal */}
          <Modal show={showDeficiencyModal} onHide={() => setShowDeficiencyModal(false)} centered>
            <Modal.Header closeButton className="bg-light">
              <Modal.Title className="fs-6 fw-bold text-warning d-flex align-items-center gap-2">
                <AlertTriangle size={18} />
                <span>Raise Official Deficiency Notice</span>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-3">
              <Form onSubmit={handleRaiseDeficiency}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Target Document</Form.Label>
                  <Form.Control type="text" value={selectedDocKey} disabled className="bg-light" />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Deficiency Reason / Required Rectification</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="e.g. Income certificate is older than 12 months. Please upload latest certificate issued by Tahsildar."
                    value={deficiencyReason}
                    onChange={(e) => setDeficiencyReason(e.target.value)}
                    required
                  />
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
                  <Button variant="outline-secondary" size="sm" onClick={() => setShowDeficiencyModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="warning" size="sm" className="fw-bold text-dark" disabled={actionLoading}>
                    {actionLoading ? <Spinner size="sm" animation="border" /> : 'Raise & Notify Applicant'}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        </Col>
      </Row>
    </Container>
  );
};

export default ReviewApplication;
