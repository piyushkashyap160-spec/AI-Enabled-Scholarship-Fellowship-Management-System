import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { FileText, Eye, FilePlus } from 'lucide-react';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await axiosClient.get('/applications/mine');
        if (res.data.success) {
          setApplications(res.data.applications || []);
        }
      } catch (e) {
        console.error('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const columns = [
    {
      label: 'Application No',
      accessor: 'applicationNo',
      render: (row) => <strong className="text-primary">{row.applicationNo}</strong>
    },
    {
      label: 'Scheme',
      accessor: (row) => row.schemeId?.name || row.schemeId?.code || 'N/A',
      render: (row) => (
        <div>
          <div className="fw-bold">{row.schemeId?.name}</div>
          <div className="small text-muted">{row.schemeId?.code} — {row.schemeId?.level?.toUpperCase()}</div>
        </div>
      )
    },
    {
      label: 'Current Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      label: 'Submitted Date',
      accessor: (row) => row.submittedAt ? new Date(row.submittedAt).toLocaleDateString('en-IN') : 'Draft',
      render: (row) => row.submittedAt ? new Date(row.submittedAt).toLocaleDateString('en-IN') : <span className="text-muted">Draft</span>
    },
    {
      label: 'Actions',
      sortable: false,
      render: (row) => (
        <Link to={`/applicant/applications/${row._id}`} className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1">
          <Eye size={14} /> View Details
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
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <FileText size={24} className="text-primary" />
                <span>My Submitted Applications</span>
              </h4>
              <p className="text-muted small mb-0">
                Track live stage progress, view OCR extraction results, and resolve deficiencies.
              </p>
            </div>

            <Link to="/applicant/applications/new" className="btn btn-gov-primary btn-sm fw-bold px-3 py-2">
              <FilePlus size={16} className="me-1" /> Apply for Scheme
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={applications}
              searchPlaceholder="Search by Application No, Scheme..."
              exportFilename="my_scholarship_applications"
            />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default MyApplications;
