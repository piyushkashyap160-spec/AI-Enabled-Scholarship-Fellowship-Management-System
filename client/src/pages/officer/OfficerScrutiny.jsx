import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Modal, Form, Alert } from 'react-bootstrap';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import EligibilityResultCard from '../../components/EligibilityResultCard';
import { FileSearch, CheckCircle2, XCircle, Award, Eye, ShieldCheck, History } from 'lucide-react';

const OfficerScrutiny = () => {
  const [applications, setApplications] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScheme, setSelectedScheme] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Decision Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [decisionType, setDecisionType] = useState('ELIGIBLE'); // 'ELIGIBLE' | 'INELIGIBLE' | 'RECOMMEND'
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchScrutinyData = async () => {
    setLoading(true);
    try {
      let url = `/officer/scrutiny?status=${selectedStatus}`;
      if (selectedScheme) url += `&schemeId=${selectedScheme}`;

      const [appsRes, sRes] = await Promise.all([
        axiosClient.get(url),
        axiosClient.get('/schemes?active=true')
      ]);

      if (appsRes.data.success) {
        setApplications(appsRes.data.applications || []);
      }
      if (sRes.data.success) {
        setSchemes(sRes.data.schemes || []);
      }
    } catch (e) {
      console.error('Failed to load officer scrutiny queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScrutinyData();
  }, [selectedScheme, selectedStatus]);

  const handleOpenDecision = (app, type) => {
    setSelectedApp(app);
    setDecisionType(type);
    setRemarks(type === 'ELIGIBLE'
      ? 'All academic certificates verified and eligibility rules satisfied.'
      : (type === 'INELIGIBLE' ? 'Failed mandatory scheme criteria.' : 'Recommended for official merit listing.')
    );
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp || !remarks.trim()) return;

    setActionLoading(true);
    setErrorMsg(null);

    try {
      let res;
      if (decisionType === 'RECOMMEND') {
        res = await axiosClient.post(`/officer/applications/${selectedApp._id}/recommend`, { remarks });
      } else {
        res = await axiosClient.post(`/officer/applications/${selectedApp._id}/eligibility-decision`, {
          decision: decisionType,
          remarks
        });
      }

      if (res.data.success) {
        setSuccessMsg(`Decision applied successfully: Marked ${decisionType}.`);
        setTimeout(() => {
          setSelectedApp(null);
          fetchScrutinyData();
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit officer decision.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      label: 'Application No',
      accessor: 'applicationNo',
      render: (row) => <strong className="text-primary">{row.applicationNo}</strong>
    },
    {
      label: 'Applicant Name',
      accessor: (row) => row.applicantId?.name || 'N/A',
      render: (row) => (
        <div>
          <div className="fw-bold">{row.applicantId?.name}</div>
          <div className="small text-muted">{row.applicantId?.profile?.state || 'ST Scholar'}</div>
        </div>
      )
    },
    {
      label: 'Scheme',
      accessor: (row) => row.schemeId?.code || 'N/A',
      render: (row) => <Badge bg="primary">{row.schemeId?.code}</Badge>
    },
    {
      label: 'Marks (%)',
      accessor: (row) => row.formData?.marksPercent || row.applicantId?.profile?.education?.marksPercent || 0,
      render: (row) => <strong>{row.formData?.marksPercent || row.applicantId?.profile?.education?.marksPercent || 0}%</strong>
    },
    {
      label: 'Income (INR)',
      accessor: (row) => row.formData?.familyIncome || row.applicantId?.profile?.familyIncome || 0,
      render: (row) => <span>₹{(row.formData?.familyIncome || row.applicantId?.profile?.familyIncome || 0).toLocaleString('en-IN')}</span>
    },
    {
      label: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} size="sm" />
    },
    {
      label: 'Scrutiny Decision',
      sortable: false,
      render: (row) => (
        <div className="d-flex gap-1.5">
          <Button
            variant="outline-success"
            size="sm"
            onClick={() => handleOpenDecision(row, 'ELIGIBLE')}
            title="Mark Eligible"
            className="d-inline-flex align-items-center gap-1"
          >
            <CheckCircle2 size={13} /> Eligible
          </Button>

          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => handleOpenDecision(row, 'INELIGIBLE')}
            title="Mark Ineligible"
            className="d-inline-flex align-items-center gap-1"
          >
            <XCircle size={13} /> Ineligible
          </Button>

          {row.status === 'ELIGIBLE' && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => handleOpenDecision(row, 'RECOMMEND')}
              title="Recommend for Merit"
              className="d-inline-flex align-items-center gap-1"
            >
              <Award size={13} /> Recommend
            </Button>
          )}
        </div>
      )
    }
  ];

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
                <FileSearch size={24} className="text-primary" />
                <span>Ministry Officer Scrutiny Panel</span>
              </h4>
              <p className="text-muted small mb-0">
                Execute human-in-the-loop eligibility assessments. Every decision is permanently recorded in the official audit trail.
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card className="gov-card p-3 mb-4 border bg-white">
            <Row className="gy-2 align-items-center">
              <Col md={6}>
                <Form.Label className="small fw-bold mb-1">Filter Scheme</Form.Label>
                <Form.Select size="sm" value={selectedScheme} onChange={(e) => setSelectedScheme(e.target.value)}>
                  <option value="">All Schemes</option>
                  {schemes.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                </Form.Select>
              </Col>

              <Col md={6}>
                <Form.Label className="small fw-bold mb-1">Stage Filter</Form.Label>
                <Form.Select size="sm" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="ALL">All Scrutiny Stages</option>
                  <option value="UNDER_SCRUTINY">Under Scrutiny</option>
                  <option value="AUTO_VERIFIED">Auto-Verified (Pending Scrutiny)</option>
                  <option value="ELIGIBLE">Marked Eligible</option>
                  <option value="INELIGIBLE">Marked Ineligible</option>
                </Form.Select>
              </Col>
            </Row>
          </Card>

          {/* DataTable */}
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <DataTable
              columns={columns}
              data={applications}
              searchPlaceholder="Search applicant, application number..."
              exportFilename="officer_scrutiny_data"
            />
          )}

          {/* Decision Modal with MANDATORY written remark */}
          <Modal show={Boolean(selectedApp)} onHide={() => setSelectedApp(null)} centered size="lg">
            <Modal.Header closeButton className="bg-light">
              <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <span>Officer Scrutiny Determination — {selectedApp?.applicationNo}</span>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              {successMsg ? (
                <Alert variant="success" className="py-3 text-center">
                  <CheckCircle2 size={32} className="text-success mb-2" />
                  <div className="fw-bold fs-6">{successMsg}</div>
                </Alert>
              ) : (
                <Form onSubmit={handleDecisionSubmit}>
                  {errorMsg && <Alert variant="danger" className="py-2 small">{errorMsg}</Alert>}

                  <div className="bg-light p-3 rounded mb-3 small">
                    <Row className="gy-1">
                      <Col md={6}>Applicant: <strong>{selectedApp?.applicantId?.name}</strong></Col>
                      <Col md={6}>Scheme: <strong>{selectedApp?.schemeId?.name}</strong></Col>
                      <Col md={6}>Category: <strong>{selectedApp?.applicantId?.profile?.category || 'ST'}</strong></Col>
                      <Col md={6}>Family Income: <strong>₹{(selectedApp?.formData?.familyIncome || 0).toLocaleString('en-IN')}</strong></Col>
                    </Row>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Determination Action</Form.Label>
                    <Form.Select
                      value={decisionType}
                      onChange={(e) => setDecisionType(e.target.value)}
                    >
                      <option value="ELIGIBLE">Mark ELIGIBLE for Merit Consideration</option>
                      <option value="INELIGIBLE">Mark INELIGIBLE (Reject Application)</option>
                      <option value="RECOMMEND">Recommend for Provisional Merit Ranking</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="small fw-bold">
                      Mandatory Written Justification / Officer Remarks <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Please record complete rationale for this determination (audited)..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      required
                    />
                    <Form.Text className="text-muted small">
                      This remark is permanently logged in the official Government Audit Log along with your digital signature.
                    </Form.Text>
                  </Form.Group>

                  <div className="d-flex justify-content-end gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => setSelectedApp(null)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant={decisionType === 'INELIGIBLE' ? 'danger' : 'gov-primary'}
                      size="sm"
                      className="fw-bold px-3"
                      disabled={actionLoading || !remarks.trim()}
                    >
                      {actionLoading ? <Spinner size="sm" animation="border" /> : 'Confirm & Commit Determination'}
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

export default OfficerScrutiny;
