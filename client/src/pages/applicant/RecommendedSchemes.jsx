import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import { Sparkles, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

const RecommendedSchemes = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await axiosClient.get('/eligibility/recommend');
        if (res.data.success) {
          setRecommendations(res.data.recommendations || []);
        }
      } catch (e) {
        console.error('Failed to load scheme recommendations');
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
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
                <Sparkles className="text-warning" size={24} />
                <span>AI-Assisted Scheme Recommendations</span>
              </h4>
              <p className="text-muted small mb-0">
                Transparent eligibility evaluation with explicit criteria reasoning based on your profile.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-5 text-muted">No active schemes found.</div>
          ) : (
            <div className="d-flex flex-column gap-4">
              {recommendations.map((rec) => (
                <Card key={rec.schemeId} className="gov-card border p-4">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <Badge bg="primary" className="text-uppercase fw-bold">{rec.code}</Badge>
                        <h5 className="mb-0 fw-bold text-dark">{rec.name}</h5>
                      </div>
                      <div className="small text-muted">
                        Level: <strong className="text-capitalize">{rec.level}</strong> | Seats: <strong>{rec.totalSeats}</strong> | Closes: <strong>{new Date(rec.closeDate).toLocaleDateString('en-IN')}</strong>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <Badge bg={rec.badgeVariant} className="px-3 py-1.5 fs-6">
                        {rec.matchLabel}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-secondary small mb-3">{rec.description}</p>

                  {/* Criteria Explanations */}
                  <div className="bg-light p-3 rounded mb-3">
                    <h6 className="fw-bold text-dark small mb-2">Detailed Rule & Document Breakdown:</h6>
                    <div className="d-flex flex-column gap-1.5 small">
                      {rec.positiveReasons.map((pos, idx) => (
                        <div key={idx} className="text-success fw-medium">
                          {pos}
                        </div>
                      ))}
                      {rec.warnings.map((warn, idx) => (
                        <div key={idx} className="text-warning fw-medium">
                          {warn}
                        </div>
                      ))}
                      {rec.negativeReasons.map((neg, idx) => (
                        <div key={idx} className="text-danger fw-medium">
                          {neg}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <Link to={`/schemes/${rec.schemeId}`} className="btn btn-outline-secondary btn-sm fw-semibold">
                      View Guidelines
                    </Link>
                    {rec.isEligible && (
                      <Link to={`/applicant/applications/new?schemeId=${rec.schemeId}`} className="btn btn-gov-primary btn-sm fw-bold px-3">
                        Apply for {rec.code} →
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default RecommendedSchemes;
