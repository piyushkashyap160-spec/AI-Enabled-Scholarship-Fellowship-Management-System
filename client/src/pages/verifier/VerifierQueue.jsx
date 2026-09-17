import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { ShieldCheck, AlertTriangle, Eye, Filter, CheckCircle2 } from 'lucide-react';

const VerifierQueue = () => {
  const [queue, setQueue] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedScheme, setSelectedScheme] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [stateFilter, setStateFilter] = useState('');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      let url = `/verifier/queue?status=${selectedStatus}&flagged=${flaggedOnly}`;
      if (selectedScheme) url += `&schemeId=${selectedScheme}`;
      if (stateFilter) url += `&state=${encodeURIComponent(stateFilter)}`;

      const [qRes, sRes] = await Promise.all([
        axiosClient.get(url),
        axiosClient.get('/schemes?active=true')
      ]);

      if (qRes.data.success) {
        setQueue(qRes.data.queue || []);
      }
      if (sRes.data.success) {
        setSchemes(sRes.data.schemes || []);
      }
    } catch (e) {
      console.error('Failed to load verifier queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [selectedScheme, selectedStatus, flaggedOnly, stateFilter]);

  const columns = [
    {
      label: 'Application No',
      accessor: 'applicationNo',
      render: (row) => (
        <div>
          <strong className="text-primary">{row.applicationNo}</strong>
          {row.documentsSummary?.hasFlags && (
            <Badge bg="danger" className="ms-2">Flagged Mismatches</Badge>
          )}
        </div>
      )
    },
    {
      label: 'Applicant Name',
      accessor: (row) => row.applicantId?.name || 'N/A',
      render: (row) => (
        <div>
          <div className="fw-bold">{row.applicantId?.name}</div>
          <div className="small text-muted">{row.applicantId?.email}</div>
        </div>
      )
    },
    {
      label: 'Scheme',
      accessor: (row) => row.schemeId?.name || 'N/A',
      render: (row) => <span className="badge bg-light text-dark border">{row.schemeId?.code}</span>
    },
    {
      label: 'State',
      accessor: (row) => row.applicantId?.profile?.state || 'Jharkhand',
      render: (row) => row.applicantId?.profile?.state || 'Jharkhand'
    },
    {
      label: 'Doc Status',
      accessor: (row) => `${row.documentsSummary?.approved}/${row.documentsSummary?.total}`,
      render: (row) => (
        <span className="small">
          <strong>{row.documentsSummary?.approved}</strong> of {row.documentsSummary?.total} Approved
          {row.documentsSummary?.pending > 0 && (
            <span className="text-warning fw-bold ms-1">({row.documentsSummary?.pending} Pending)</span>
          )}
        </span>
      )
    },
    {
      label: 'Stage',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} size="sm" />
    },
    {
      label: 'Action',
      sortable: false,
      render: (row) => (
        <Link to={`/verifier/review/${row._id}`} className="btn btn-gov-primary btn-sm fw-semibold d-inline-flex align-items-center gap-1">
          <Eye size={14} /> Scrutinize
        </Link>
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
                <ShieldCheck size={24} className="text-primary" />
                <span>Document Verification Queue</span>
              </h4>
              <p className="text-muted small mb-0">
                Review OCR extraction confidence, inspect declared vs extracted mismatches, and approve documents.
              </p>
            </div>
          </div>

          {/* Filter Toolbar */}
          <Card className="gov-card p-3 mb-4 border bg-white">
            <Row className="gy-2 align-items-center">
              <Col md={3}>
                <Form.Label className="small fw-bold mb-1">Filter Scheme</Form.Label>
                <Form.Select size="sm" value={selectedScheme} onChange={(e) => setSelectedScheme(e.target.value)}>
                  <option value="">All Schemes</option>
                  {schemes.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                </Form.Select>
              </Col>

              <Col md={3}>
                <Form.Label className="small fw-bold mb-1">Stage Status</Form.Label>
                <Form.Select size="sm" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="ALL">All Active Stages</option>
                  <option value="UNDER_VERIFICATION">Under Verification</option>
                  <option value="AUTO_VERIFIED">Auto-Verified</option>
                  <option value="DEFICIENT">Deficient</option>
                  <option value="OCR_PROCESSING">OCR Processing</option>
                </Form.Select>
              </Col>

              <Col md={3}>
                <Form.Label className="small fw-bold mb-1">Applicant State</Form.Label>
                <Form.Select size="sm" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                  <option value="">All Indian States</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Meghalaya">Meghalaya</option>
                </Form.Select>
              </Col>

              <Col md={3} className="d-flex align-items-end">
                <Form.Check
                  type="checkbox"
                  id="flagged-toggle"
                  label="Flagged Issues Only"
                  checked={flaggedOnly}
                  onChange={(e) => setFlaggedOnly(e.target.checked)}
                  className="fw-bold small text-danger"
                />
              </Col>
            </Row>
          </Card>

          {/* Verification Table */}
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <DataTable
              columns={columns}
              data={queue}
              searchPlaceholder="Search applicant, application number..."
              exportFilename="verifier_queue_data"
            />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default VerifierQueue;
