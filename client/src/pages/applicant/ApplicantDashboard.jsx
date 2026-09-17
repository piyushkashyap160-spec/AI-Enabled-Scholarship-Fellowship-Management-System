import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { FileText, AlertTriangle, Award, Sparkles, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

const ApplicantDashboard = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [deficiencies, setDeficiencies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [appsRes, recRes] = await Promise.all([
          axiosClient.get('/applications/mine'),
          axiosClient.get('/eligibility/recommend')
        ]);

        if (appsRes.data.success) {
          setApplications(appsRes.data.applications || []);
        }
        if (recRes.data.success) {
          setRecommendations(recRes.data.recommendations || []);
        }
      } catch (e) {
        console.error('Failed to load applicant dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const deficientApps = applications.filter(a => a.status === 'DEFICIENT');
  const selectedApps = applications.filter(a => ['SELECTED', 'AWARD_ACCEPTED', 'DISBURSING', 'COMPLETED'].includes(a.status));

  return (
    <Container fluid className="py-4 px-lg-4">
      <Row className="gy-4">
        {/* Left Sidebar */}
        <Col lg={3} md={4}>
          <Sidebar />
        </Col>

        {/* Main Content */}
        <Col lg={9} md={8}>
          {/* Welcome Banner */}
          <Card className="gov-card p-4 mb-4 border bg-white">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h4 className="fw-bold text-dark mb-1">
                  Welcome back, {user?.name}!
                </h4>
                <div className="text-muted small">
                  Category: <strong>{user?.profile?.category || 'ST'}</strong> | Domicile: <strong>{user?.profile?.state || 'India'}</strong> | Highest Level: <strong className="text-capitalize">{user?.profile?.education?.level || 'Masters'}</strong>
                </div>
              </div>
              <Link to="/applicant/applications/new" className="btn btn-gov-primary btn-sm fw-bold px-3 py-2">
                + New Application
              </Link>
            </div>
          </Card>

          {/* Stat Cards Row */}
          <Row className="gy-3 mb-4">
            <Col sm={6} lg={3}>
              <StatCard
                title="Applications"
                value={applications.length}
                icon={FileText}
                color="primary"
                subtitle="Submitted or Draft"
              />
            </Col>
            <Col sm={6} lg={3}>
              <StatCard
                title="Action Required"
                value={deficientApps.length}
                icon={AlertTriangle}
                color="warning"
                subtitle="Open Deficiencies"
              />
            </Col>
            <Col sm={6} lg={3}>
              <StatCard
                title="Matched Schemes"
                value={recommendations.filter(r => r.isEligible).length}
                icon={Sparkles}
                color="info"
                subtitle="Pre-Checked Eligible"
              />
            </Col>
            <Col sm={6} lg={3}>
              <StatCard
                title="Fellowships"
                value={selectedApps.length}
                icon={Award}
                color="success"
                subtitle="Selected / Awarded"
              />
            </Col>
          </Row>

          {/* Deficiency Alert Banner if open deficiencies exist */}
          {deficientApps.length > 0 && (
            <Alert variant="warning" className="d-flex justify-content-between align-items-center mb-4 p-3 shadow-sm border-warning">
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={24} className="text-warning flex-shrink-0" />
                <div>
                  <strong className="text-dark">Deficiency Notice: Document Action Required!</strong>
                  <div className="small text-secondary">
                    You have {deficientApps.length} application(s) with flagged documents. Please re-upload before the deadline.
                  </div>
                </div>
              </div>
              <Link to="/applicant/deficiencies" className="btn btn-warning btn-sm fw-bold text-dark">
                Resolve Now →
              </Link>
            </Alert>
          )}

          {/* My Applications Section */}
          <Card className="gov-card p-3 mb-4 border">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 fs-6 fw-bold text-dark">My Active Applications</h5>
              <Link to="/applicant/applications" className="small text-primary text-decoration-none fw-semibold">
                View All ({applications.length}) →
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
            ) : applications.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                You have not submitted any applications yet. <Link to="/schemes">Explore Open Schemes</Link>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {applications.slice(0, 3).map((app) => (
                  <div key={app._id} className="p-3 border rounded bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <strong className="text-dark">{app.applicationNo}</strong>
                        <StatusBadge status={app.status} size="sm" />
                      </div>
                      <div className="small text-muted">
                        Scheme: <strong>{app.schemeId?.name || app.schemeId?.code}</strong> | Submitted: {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-IN') : 'Draft'}
                      </div>
                    </div>
                    <Link to={`/applicant/applications/${app._id}`} className="btn btn-outline-primary btn-sm fw-semibold">
                      Track Status →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Top Recommended Schemes */}
          <Card className="gov-card p-3 border">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 fs-6 fw-bold text-dark d-flex align-items-center gap-1.5">
                <Sparkles size={18} className="text-warning" />
                <span>Schemes Recommended for Your Profile</span>
              </h5>
              <Link to="/applicant/recommendations" className="small text-primary text-decoration-none fw-semibold">
                See Detailed Analysis →
              </Link>
            </div>

            <div className="d-flex flex-column gap-2">
              {recommendations.slice(0, 2).map((rec) => (
                <div key={rec.schemeId} className="p-3 border rounded bg-white">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <strong className="text-dark fs-6">{rec.name} ({rec.code})</strong>
                      <div className="small text-muted">{rec.description?.slice(0, 100)}…</div>
                    </div>
                    <Badge bg={rec.badgeVariant}>{rec.matchLabel}</Badge>
                  </div>

                  <div className="small text-secondary mb-2">
                    {rec.positiveReasons.slice(0, 2).map((r, i) => (
                      <div key={i} className="text-success">{r}</div>
                    ))}
                    {rec.warnings.slice(0, 1).map((w, i) => (
                      <div key={i} className="text-warning">{w}</div>
                    ))}
                  </div>

                  <div className="d-flex justify-content-end">
                    <Link to={`/applicant/applications/new?schemeId=${rec.schemeId}`} className="btn btn-gov-primary btn-sm fw-semibold">
                      Apply for {rec.code} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ApplicantDashboard;
