import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import StatusBadge from '../../components/StatusBadge';
import { Layers, ArrowRight, Eye, CheckCircle2 } from 'lucide-react';

const SelectionWorkflow = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        const res = await axiosClient.get('/officer/scrutiny?status=ALL');
        if (res.data.success) {
          setApplications(res.data.applications || []);
        }
      } catch (e) {}
      finally {
        setLoading(false);
      }
    };
    fetchWorkflow();
  }, []);

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
                <Layers size={24} className="text-primary" />
                <span>Selection Workflow & Transition Tracker</span>
              </h4>
              <p className="text-muted small mb-0">
                End-to-end status progression from Scrutiny to Merit Ranking and Award Acceptance.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Card className="gov-card p-3 border">
              <div className="table-responsive">
                <Table bordered hover size="sm" className="gov-table small align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Application Ref</th>
                      <th>Applicant Name</th>
                      <th>Scheme</th>
                      <th>Current Stage</th>
                      <th>Last Transition</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.slice(0, 20).map((app) => (
                      <tr key={app._id}>
                        <td className="fw-bold text-primary">{app.applicationNo}</td>
                        <td>{app.applicantId?.name}</td>
                        <td><Badge bg="secondary">{app.schemeId?.code}</Badge></td>
                        <td><StatusBadge status={app.status} size="sm" /></td>
                        <td className="text-muted small">{app.stageHistory?.slice(-1)[0]?.remark || 'Processing'}</td>
                        <td>
                          <Link to={`/applicant/applications/${app._id}`} className="btn btn-outline-primary btn-sm py-0.5 px-2 small">
                            <Eye size={12} className="me-1" /> View Full
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default SelectionWorkflow;
