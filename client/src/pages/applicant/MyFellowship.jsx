import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import { Award, CheckCircle2, Clock, UploadCloud, FileText, Check } from 'lucide-react';

const MyFellowship = () => {
  const [disbursements, setDisbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisbursement, setSelectedDisbursement] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchDisbursements = async () => {
    try {
      const res = await axiosClient.get('/disbursements/mine');
      if (res.data.success) {
        setDisbursements(res.data.disbursements || []);
      }
    } catch (e) {
      console.error('Failed to load disbursements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisbursements();
  }, []);

  const handleUploadReport = async (e) => {
    e.preventDefault();
    if (!reportFile || !selectedDisbursement) return;

    setUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', reportFile);

    try {
      const res = await axiosClient.post(`/disbursements/${selectedDisbursement._id}/report`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setSuccessMsg('Progress report and supervisor certification submitted successfully!');
        setTimeout(() => {
          setSelectedDisbursement(null);
          setReportFile(null);
          setSuccessMsg(null);
          fetchDisbursements();
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload report.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container fluid className="py-4 px-lg-4">
      <Row className="gy-4">
        <Col lg={3} md={4}>
          <Sidebar />
        </Col>

        <Col lg={9} md={8}>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <Award className="text-success" size={24} />
                <span>My Fellowship Management & DBT PFMS Disbursements</span>
              </h4>
              <p className="text-muted small mb-0">
                Manage post-award research milestones, upload biannual progress reports, and track stipend disbursements.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : disbursements.length === 0 ? (
            <Card className="gov-card p-5 text-center text-muted border">
              <Award size={48} className="mx-auto mb-2 text-warning opacity-75" />
              <h5 className="fw-bold text-dark">No Active Fellowship Award Records</h5>
              <p className="small mb-0">
                Disbursements are activated upon official merit selection and award acceptance by Ministry officers.
              </p>
            </Card>
          ) : (
            <Card className="gov-card p-4 border">
              <h5 className="fw-bold text-dark mb-3">Installment Milestone Schedule</h5>

              <div className="table-responsive">
                <Table bordered hover className="gov-table small align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Installment</th>
                      <th>Scheduled Amount</th>
                      <th>Due Date</th>
                      <th>Progress Report Status</th>
                      <th>DBT Release Status</th>
                      <th>Transaction ID</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disbursements.map((disb) => (
                      <tr key={disb._id}>
                        <td className="fw-bold">#{disb.installmentNo}</td>
                        <td className="fw-bold text-success">₹{disb.amount?.toLocaleString('en-IN')}</td>
                        <td>{new Date(disb.dueDate).toLocaleDateString('en-IN')}</td>
                        <td>
                          {disb.guideApproved ? (
                            <Badge bg="success"><Check size={12} className="me-1" /> Supervisor Certified</Badge>
                          ) : (
                            <Badge bg="warning" text="dark"><Clock size={12} className="me-1" /> Pending Report</Badge>
                          )}
                        </td>
                        <td>
                          <Badge bg={disb.status === 'released' ? 'success' : (disb.status === 'held' ? 'danger' : 'secondary')}>
                            {disb.status === 'released' ? 'Released via DBT' : disb.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td>
                          {disb.transactionId ? <code>{disb.transactionId}</code> : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          {disb.status === 'pending' && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="d-flex align-items-center gap-1"
                              onClick={() => setSelectedDisbursement(disb)}
                            >
                              <UploadCloud size={14} /> Upload Report
                            </Button>
                          )}
                          {disb.status === 'released' && (
                            <span className="text-success small fw-semibold">Disbursed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          )}

          {/* Progress Report Modal */}
          <Modal show={Boolean(selectedDisbursement)} onHide={() => setSelectedDisbursement(null)} centered>
            <Modal.Header closeButton className="bg-light">
              <Modal.Title className="fs-6 fw-bold">
                Upload Progress Report & Supervisor Endorsement
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-3">
              {successMsg ? (
                <Alert variant="success" className="py-2 small text-center">{successMsg}</Alert>
              ) : (
                <Form onSubmit={handleUploadReport}>
                  {errorMsg && <Alert variant="danger" className="py-2 small">{errorMsg}</Alert>}
                  <p className="small text-secondary mb-3">
                    Please upload your research progress report endorsed by your Research Guide/Supervisor to release Installment #{selectedDisbursement?.installmentNo} (₹{selectedDisbursement?.amount?.toLocaleString('en-IN')}).
                  </p>

                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Select Endorsed Report (PDF)</Form.Label>
                    <Form.Control
                      type="file"
                      accept=".pdf,.jpg,.png"
                      onChange={(e) => setReportFile(e.target.files[0])}
                      required
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-end gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => setSelectedDisbursement(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="gov-primary" size="sm" disabled={uploading || !reportFile}>
                      {uploading ? <Spinner size="sm" animation="border" /> : 'Submit Progress Report'}
                    </Button>
                  </div>
                </Form>
              )}
            </Modal.Body>
          </Modal>
        </Col>
      </Row>
    </Container>
  );
};

export default MyFellowship;
