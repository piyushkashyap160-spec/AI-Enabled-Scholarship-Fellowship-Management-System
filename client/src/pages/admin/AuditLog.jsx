import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner } from 'react-bootstrap';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import DataTable from '../../components/DataTable';
import { History, ShieldCheck, Filter } from 'lucide-react';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchAudit = async () => {
    setLoading(true);
    try {
      let url = '/admin/audit?limit=100';
      if (actionFilter) url += `&action=${actionFilter}`;
      if (entityFilter) url += `&entityType=${entityFilter}`;

      const res = await axiosClient.get(url);
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (e) {
      console.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [actionFilter, entityFilter]);

  const columns = [
    {
      label: 'Timestamp',
      accessor: (row) => new Date(row.at).toLocaleString('en-IN'),
      render: (row) => (
        <span className="small text-nowrap">
          {new Date(row.at).toLocaleDateString('en-IN')}{' '}
          <span className="text-muted">{new Date(row.at).toLocaleTimeString('en-IN')}</span>
        </span>
      )
    },
    {
      label: 'Actor (Authority)',
      accessor: 'actorName',
      render: (row) => (
        <div>
          <strong className="text-dark">{row.actorName || 'System'}</strong>
          <div className="small text-muted text-uppercase">{row.actorRole}</div>
        </div>
      )
    },
    {
      label: 'Action Executed',
      accessor: 'action',
      render: (row) => <Badge bg="secondary">{row.action}</Badge>
    },
    {
      label: 'Entity Target',
      accessor: 'entityType',
      render: (row) => (
        <span className="small">
          <strong>{row.entityType}</strong> ({row.entityId?.slice(-6)})
        </span>
      )
    },
    {
      label: 'Written Justification / Reason',
      accessor: 'reason',
      render: (row) => <span className="small text-secondary fst-italic">"{row.reason}"</span>
    },
    {
      label: 'IP Address',
      accessor: 'ip',
      render: (row) => <code className="small">{row.ip || '127.0.0.1'}</code>
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
                <History size={24} className="text-primary" />
                <span>Official Government Audit Log</span>
              </h4>
              <p className="text-muted small mb-0">
                Tamper-evident log tracking every scheme modification, officer determination, and administrative override.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <Card className="gov-card p-3 mb-4 border bg-white">
            <Row className="gy-2">
              <Col md={6}>
                <Form.Label className="small fw-bold mb-1">Filter by Entity</Form.Label>
                <Form.Select size="sm" value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
                  <option value="">All Entities</option>
                  <option value="Application">Application Changes</option>
                  <option value="Scheme">Scheme & Rule Changes</option>
                  <option value="User">User Role Changes</option>
                  <option value="Disbursement">Disbursement Releases</option>
                </Form.Select>
              </Col>

              <Col md={6}>
                <Form.Label className="small fw-bold mb-1">Filter by Action Keyword</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="e.g. OFFICER_SCRUTINY, OVERRIDE, UPDATE"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                />
              </Col>
            </Row>
          </Card>

          {/* Audit DataTable */}
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <DataTable
              columns={columns}
              data={logs}
              searchPlaceholder="Search actor, action, reason..."
              exportFilename="official_government_audit_log"
            />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default AuditLog;
