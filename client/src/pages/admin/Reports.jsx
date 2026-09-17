import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner, Badge } from 'react-bootstrap';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import { BarChart3, Download, FileText, CheckCircle } from 'lucide-react';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [byState, setByState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [sRes, stateRes] = await Promise.all([
          axiosClient.get('/dashboard/stats'),
          axiosClient.get('/dashboard/by-state')
        ]);
        if (sRes.data.success) setStats(sRes.data.stats);
        if (stateRes.data.success) setByState(stateRes.data);
      } catch (e) {
        console.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportSummary = () => {
    const csvContent = 'data:text/csv;charset=utf-8,State,Applications\n' +
      (byState?.labels || []).map((l, i) => `"${l}",${byState?.data[i] || 0}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `state_wise_applications_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                <BarChart3 size={24} className="text-primary" />
                <span>Reports, Analytics & Ministry Exports</span>
              </h4>
              <p className="text-muted small mb-0">
                Official tabular reports, state representation analytics, and data exports for Parliamentary reporting.
              </p>
            </div>

            <Button
              variant="gov-primary"
              size="sm"
              onClick={handleExportSummary}
              className="d-flex align-items-center gap-1.5 fw-semibold"
            >
              <Download size={14} /> Export State Analytics CSV
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <>
              {/* Summary Table */}
              <Card className="gov-card p-3 mb-4 border">
                <h5 className="fw-bold text-dark mb-3">State-Wise ST Scholar Application Distribution</h5>

                <div className="table-responsive">
                  <Table bordered hover size="sm" className="gov-table small align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>State / Union Territory</th>
                        <th>Total Submissions</th>
                        <th>Representation Share</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(byState?.labels || []).map((state, idx) => {
                        const count = byState?.data[idx] || 0;
                        const total = (byState?.data || []).reduce((a, b) => a + b, 0) || 1;
                        const share = ((count / total) * 100).toFixed(1);

                        return (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td className="fw-bold text-dark">{state}</td>
                            <td className="fw-bold text-primary">{count}</td>
                            <td>{share}%</td>
                            <td><Badge bg="success">Active</Badge></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </Card>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Reports;
