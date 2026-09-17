import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Alert } from 'react-bootstrap';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import { AlertOctagon, ShieldAlert, FileText, CheckCircle, RefreshCw, Eye } from 'lucide-react';

const Anomalies = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/admin/anomalies');
      if (res.data.success) {
        setAnomalies(res.data.anomalies || []);
      }
    } catch (e) {
      console.error('Failed to run anomaly scan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

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
                <AlertOctagon size={24} className="text-danger" />
                <span>Fraud & Anomaly Detection Dashboard</span>
              </h4>
              <p className="text-muted small mb-0">
                Automated multi-factor anomaly flagging across file hashes, certificate numbers, bank accounts, and identity records.
              </p>
            </div>

            <Button
              variant="outline-secondary"
              size="sm"
              onClick={fetchAnomalies}
              className="d-flex align-items-center gap-1.5"
            >
              <RefreshCw size={14} /> Run Anomaly Scan
            </Button>
          </div>

          <Alert variant="info" className="py-2.5 small mb-4">
            <strong>Government Compliance Standard:</strong> All flags below are purely for human officer review. Standard protocol: <em>"Anomaly detected, manual verification required."</em> No automated punitive actions are taken.
          </Alert>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : anomalies.length === 0 ? (
            <Card className="gov-card p-5 text-center text-muted border">
              <CheckCircle size={48} className="mx-auto mb-2 text-success" />
              <h5 className="fw-bold text-dark">No System Anomalies Detected</h5>
              <p className="small mb-0">
                No duplicate certificates, shared bank accounts, or identical file hashes were found across database records.
              </p>
            </Card>
          ) : (
            <div className="d-flex flex-column gap-3">
              {anomalies.map((anom, idx) => (
                <Card key={idx} className="gov-card p-4 border border-danger border-opacity-50 shadow-sm">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <ShieldAlert size={22} className="text-danger" />
                      <h5 className="mb-0 fw-bold text-dark fs-6">{anom.title}</h5>
                    </div>
                    <Badge bg={anom.severity === 'critical' ? 'danger' : 'warning'} text={anom.severity === 'critical' ? 'white' : 'dark'}>
                      {anom.type}
                    </Badge>
                  </div>

                  <p className="text-secondary small mb-3" style={{ lineHeight: '1.5' }}>
                    {anom.description}
                  </p>

                  <div className="p-2.5 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded small text-danger fw-semibold mb-3">
                    Protocol Action: {anom.actionRequired}
                  </div>

                  {/* Affected Entities Breakdown */}
                  {anom.details?.affectedApplications && (
                    <div className="bg-light p-3 rounded small">
                      <strong className="d-block mb-1.5 text-dark">Affected Applications:</strong>
                      <div className="d-flex flex-column gap-1">
                        {anom.details.affectedApplications.map((app, aIdx) => (
                          <div key={aIdx} className="d-flex justify-content-between text-muted">
                            <span>• <strong>{app.applicantName}</strong> ({app.email})</span>
                            <code>{app.applicationNo}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {anom.details?.registeredUsers && (
                    <div className="bg-light p-3 rounded small">
                      <strong className="d-block mb-1.5 text-dark">Affected Accounts (Bank Account: {anom.details.accountMasked}):</strong>
                      <div className="d-flex flex-column gap-1">
                        {anom.details.registeredUsers.map((u, uIdx) => (
                          <div key={uIdx} className="text-muted">
                            • <strong>{u.name}</strong> ({u.email})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Anomalies;
