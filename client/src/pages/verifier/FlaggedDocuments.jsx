import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle, Eye } from 'lucide-react';

const FlaggedDocuments = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlagged = async () => {
      try {
        const res = await axiosClient.get('/verifier/queue?flagged=true');
        if (res.data.success) {
          setQueue(res.data.queue || []);
        }
      } catch (e) {
        console.error('Failed to load flagged queue');
      } finally {
        setLoading(false);
      }
    };
    fetchFlagged();
  }, []);

  const columns = [
    {
      label: 'Application No',
      accessor: 'applicationNo',
      render: (row) => <strong className="text-danger">{row.applicationNo}</strong>
    },
    {
      label: 'Applicant Name',
      accessor: (row) => row.applicantId?.name || 'N/A',
      render: (row) => <div><div className="fw-bold">{row.applicantId?.name}</div><div className="small text-muted">{row.applicantId?.email}</div></div>
    },
    {
      label: 'Scheme',
      accessor: (row) => row.schemeId?.code || 'N/A',
      render: (row) => <Badge bg="primary">{row.schemeId?.code}</Badge>
    },
    {
      label: 'Stage',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} size="sm" />
    },
    {
      label: 'Action Required',
      sortable: false,
      render: (row) => (
        <Link to={`/verifier/review/${row._id}`} className="btn btn-danger btn-sm fw-semibold d-inline-flex align-items-center gap-1">
          <Eye size={14} /> Review Mismatches
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
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <AlertTriangle size={24} className="text-danger" />
                <span>Flagged Documents & Mismatches Queue</span>
              </h4>
              <p className="text-muted small mb-0">
                Applications where AI OCR detected discrepancies between certificate contents and declared form fields.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <DataTable
              columns={columns}
              data={queue}
              searchPlaceholder="Search flagged applications..."
              exportFilename="flagged_documents_queue"
            />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default FlaggedDocuments;
