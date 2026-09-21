import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import ConfirmModal from '../../components/ConfirmModal';
import { CreditCard, CheckCircle, Clock, FileText, ArrowUpRight, Send, AlertCircle, RefreshCw } from 'lucide-react';

const DisbursementReview = () => {
  const [disbursements, setDisbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisbursement, setSelectedDisbursement] = useState(null);
  const [remarks, setRemarks] = useState('Disbursement released via DBT PFMS');
  const [transactionId, setTransactionId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchPendingDisbursements = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/disbursements/pending');
      if (res.data.success) {
        setDisbursements(res.data.disbursements || []);
      }
    } catch (err) {
      setErrorMsg('Failed to load pending disbursement review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDisbursements();
  }, []);

  const handleViewReport = async (disb) => {
    try {
      const res = await axiosClient.get(`/disbursements/${disb._id}/report`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setErrorMsg('Failed to retrieve authorized progress report file.');
    }
  };

  const handleOpenReleaseModal = (disb) => {
    setSelectedDisbursement(disb);
    setRemarks(`Disbursement milestone #${disb.installmentNo} released via DBT PFMS`);
    setTransactionId(`PFMS${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleConfirmRelease = async () => {
    if (!selectedDisbursement) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await axiosClient.post(`/disbursements/${selectedDisbursement._id}/release`, {
        remarks,
        transactionId: transactionId.trim() || undefined
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message || `Installment #${selectedDisbursement.installmentNo} marked as released.`);
        setSelectedDisbursement(null);
        await fetchPendingDisbursements();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to release disbursement.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPendingAmount = disbursements.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <Container fluid className="py-4 px-lg-4">
      <Row className="gy-4">
        <Col lg={3} md={4}>
          <Sidebar />
        </Col>

        <Col lg={9} md={8}>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <CreditCard size={24} className="text-primary" />
                <span>DBT Disbursement Scrutiny & Milestone Release</span>
              </h4>
              <p className="text-muted small mb-0">
                Review submitted scholar progress reports, supervisor endorsements, and authorize DBT PFMS transfers.
              </p>
            </div>

            <Button
              variant="outline-secondary"
              size="sm"
              className="d-flex align-items-center gap-1"
              onClick={fetchPendingDisbursements}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Queue
            </Button>
          </div>

          {successMsg && (
            <Alert variant="success" dismissible onClose={() => setSuccessMsg(null)} className="py-2 px-3 small mb-3">
              {successMsg}
            </Alert>
          )}

          {errorMsg && (
            <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)} className="py-2 px-3 small mb-3">
              {errorMsg}
            </Alert>
          )}

          {/* Quick Metrics */}
          <Card className="gov-card p-3 mb-4 border bg-light">
            <Row className="text-center gy-2">
              <Col md={4} xs={6} className="border-end">
                <div className="small text-muted">Pending Reviews</div>
                <div className="fs-4 fw-bold text-dark">{disbursements.length}</div>
              </Col>
              <Col md={4} xs={6} className="border-end">
                <div className="small text-muted">Total Pending Authorization</div>
                <div className="fs-4 fw-bold text-primary">₹{totalPendingAmount.toLocaleString('en-IN')}</div>
              </Col>
              <Col md={4} xs={12}>
                <div className="small text-muted">Gateway Status</div>
                <div className="fs-6 fw-bold text-success mt-1">
                  <Badge bg="success">PFMS Gateway Active</Badge>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Pending Queue Table */}
          <Card className="gov-card p-3 border">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <Clock size={20} className="text-warning" />
              <span>Pending Disbursement Milestones ({disbursements.length})</span>
            </h5>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : disbursements.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <CheckCircle size={40} className="text-success mb-2 opacity-50" />
                <p className="mb-0">No pending disbursement reports requiring release.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table bordered hover size="sm" className="gov-table small align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '10%' }}>Milestone</th>
                      <th style={{ width: '22%' }}>Scholar Details</th>
                      <th style={{ width: '20%' }}>Scheme</th>
                      <th style={{ width: '12%' }} className="text-end">Amount</th>
                      <th style={{ width: '20%' }}>Progress Report</th>
                      <th style={{ width: '16%' }} className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disbursements.map((disb) => {
                      const app = disb.applicationId || {};
                      const applicant = app.applicantId || {};
                      const scheme = app.schemeId || {};
                      return (
                        <tr key={disb._id}>
                          <td className="fw-bold text-center">
                            Installment #{disb.installmentNo}
                            <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                              Due: {new Date(disb.dueDate).toLocaleDateString('en-IN')}
                            </div>
                          </td>
                          <td>
                            <div className="fw-bold text-dark">{applicant.name || 'Scholar'}</div>
                            <div className="text-muted small">{app.applicationNo || 'N/A'}</div>
                            <div className="text-muted small">{applicant.email}</div>
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">{scheme.name || 'Scheme'}</div>
                            <Badge bg="secondary" style={{ fontSize: '0.7rem' }}>{scheme.code}</Badge>
                          </td>
                          <td className="text-end fw-bold text-success fs-6">
                            ₹{disb.amount?.toLocaleString('en-IN')}
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              {disb.guideApproved && (
                                <span className="badge bg-success bg-opacity-75 text-white" style={{ fontSize: '0.7rem' }}>
                                  ✓ Supervisor Certified
                                </span>
                              )}
                              {disb.progressReportPath ? (
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="py-0 px-2 d-inline-flex align-items-center gap-1"
                                  style={{ fontSize: '0.75rem', width: 'fit-content' }}
                                  onClick={() => handleViewReport(disb)}
                                >
                                  <FileText size={12} /> View Report <ArrowUpRight size={12} />
                                </Button>
                              ) : (
                                <span className="text-muted fst-italic" style={{ fontSize: '0.75rem' }}>
                                  No file attached
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="text-center">
                            <Button
                              variant="success"
                              size="sm"
                              className="fw-bold d-inline-flex align-items-center gap-1"
                              onClick={() => handleOpenReleaseModal(disb)}
                            >
                              <Send size={13} /> Release DBT
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </Card>

          {/* Release Modal with remarks and transaction ID */}
          <Modal show={Boolean(selectedDisbursement)} onHide={() => setSelectedDisbursement(null)} centered>
            <Modal.Header closeButton className="bg-light">
              <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
                <CreditCard size={18} className="text-success" />
                <span>Authorize DBT PFMS Release</span>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedDisbursement && (
                <>
                  <p className="small text-secondary mb-3">
                    You are authorizing the release of <strong>₹{selectedDisbursement.amount?.toLocaleString('en-IN')}</strong> (Installment #{selectedDisbursement.installmentNo}) to scholar <strong>{selectedDisbursement.applicationId?.applicantId?.name}</strong>.
                  </p>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Transaction Reference / UTR Number</Form.Label>
                    <Form.Control
                      type="text"
                      size="sm"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. PFMS2026..."
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Audit Remarks / Justification</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      size="sm"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Remarks..."
                    />
                  </Form.Group>
                </>
              )}
            </Modal.Body>
            <Modal.Footer className="bg-light py-2">
              <Button variant="outline-secondary" size="sm" onClick={() => setSelectedDisbursement(null)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button variant="success" size="sm" onClick={handleConfirmRelease} disabled={isProcessing} className="fw-semibold">
                {isProcessing ? <Spinner animation="border" size="sm" /> : 'Confirm & Release'}
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Container>
  );
};

export default DisbursementReview;
