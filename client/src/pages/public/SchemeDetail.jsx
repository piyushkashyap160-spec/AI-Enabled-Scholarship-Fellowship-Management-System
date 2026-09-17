import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Alert } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Award, FileText, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SchemeDetail = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScheme = async () => {
      try {
        const res = await axiosClient.get(`/schemes/${id}`);
        if (res.data.success) {
          setScheme(res.data.scheme);
        }
      } catch (e) {
        console.error('Failed to load scheme');
      } finally {
        setLoading(false);
      }
    };
    fetchScheme();
  }, [id]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (!scheme) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Scheme not found. <Link to="/schemes">View all schemes</Link></Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Link to="/schemes" className="btn btn-outline-secondary btn-sm mb-3 d-inline-flex align-items-center gap-1">
        <ArrowLeft size={14} /> Back to Schemes
      </Link>

      {/* Header Banner */}
      <Card className="gov-card p-4 mb-4 border">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <Badge bg="primary" className="px-3 py-1.5 fs-6 text-uppercase fw-bold mb-2">
              {scheme.code} — {scheme.category}
            </Badge>
            <h2 className="fw-bold text-dark mb-1">{scheme.name}</h2>
            <div className="text-muted small">
              Level: <strong className="text-capitalize">{scheme.level}</strong> | Application Period: <strong>{new Date(scheme.openDate).toLocaleDateString('en-IN')}</strong> to <strong>{new Date(scheme.closeDate).toLocaleDateString('en-IN')}</strong>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link to={`/eligibility?scheme=${scheme.code}`} className="btn btn-outline-primary fw-semibold">
              Pre-Check Eligibility
            </Link>
            <Link
              to={isAuthenticated ? `/applicant/applications/new?schemeId=${scheme._id}` : `/login?redirect=/applicant/applications/new?schemeId=${scheme._id}`}
              className="btn btn-gov-primary fw-bold px-4"
            >
              Apply Online →
            </Link>
          </div>
        </div>

        <p className="text-secondary mb-0" style={{ lineHeight: '1.6' }}>
          {scheme.description}
        </p>
      </Card>

      <Row className="gy-4">
        {/* Left Column: Eligibility Rules & Documents */}
        <Col lg={8}>
          {/* Eligibility Rules */}
          <Card className="gov-card p-3 mb-4 border">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <ShieldCheck className="text-primary" size={20} />
              <span>Eligibility Rules & Conditions</span>
            </h5>

            <div className="table-responsive">
              <Table bordered hover size="sm" className="gov-table small align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Criterion</th>
                    <th>Condition</th>
                    <th>Rule Specification</th>
                  </tr>
                </thead>
                <tbody>
                  {scheme.eligibilityRules?.map((rule, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold text-capitalize">{rule.field.replace(/_/g, ' ')}</td>
                      <td><code>{rule.operator}</code> {JSON.stringify(rule.value)}</td>
                      <td>{rule.message}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>

          {/* Required Documents */}
          <Card className="gov-card p-3 mb-4 border">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <FileText className="text-success" size={20} />
              <span>Mandatory Supporting Documents (Offline OCR Verified)</span>
            </h5>

            <div className="table-responsive">
              <Table bordered hover size="sm" className="gov-table small align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Document Name</th>
                    <th>Accepted Formats</th>
                    <th>Validity Period</th>
                    <th>Key OCR Extracted Attributes</th>
                  </tr>
                </thead>
                <tbody>
                  {scheme.requiredDocuments?.map((doc, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold">{doc.label}</td>
                      <td>{doc.acceptedTypes?.join(', ').toUpperCase()} (Max 5MB)</td>
                      <td>{doc.maxAgeMonths > 0 ? `Within ${doc.maxAgeMonths} months` : 'Lifetime Valid'}</td>
                      <td>
                        {doc.ocrFields?.map(f => (
                          <span key={f} className="badge bg-light text-dark border me-1 mb-1">
                            {f.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        </Col>

        {/* Right Column: Key Details & Merit Weights */}
        <Col lg={4}>
          <Card className="gov-card p-3 mb-4 border bg-light">
            <h6 className="fw-bold text-dark mb-3">Scheme Overview</h6>
            <div className="d-flex flex-column gap-2 small">
              <div className="d-flex justify-content-between pb-1 border-bottom">
                <span className="text-muted">Total Available Seats:</span>
                <strong className="text-dark">{scheme.totalSeats}</strong>
              </div>
              <div className="d-flex justify-content-between pb-1 border-bottom">
                <span className="text-muted">Annual Financial Stipend:</span>
                <strong className="text-success">₹{(scheme.stipendAmountPerYear || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div className="d-flex justify-content-between pb-1 border-bottom">
                <span className="text-muted">Female Horizontal Quota:</span>
                <strong className="text-dark">{((scheme.reservationQuota?.female || 0.30) * 100)}%</strong>
              </div>
              <div className="d-flex justify-content-between pb-1 border-bottom">
                <span className="text-muted">PwD Horizontal Quota:</span>
                <strong className="text-dark">{((scheme.reservationQuota?.disability || 0.04) * 100)}%</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">PVTG Priority Quota:</span>
                <strong className="text-dark">{((scheme.reservationQuota?.pvtg || 0.05) * 100)}%</strong>
              </div>
            </div>
          </Card>

          {/* Merit Scoring Weights */}
          <Card className="gov-card p-3 border">
            <h6 className="fw-bold text-dark mb-2">Merit Ranking Weights</h6>
            <p className="small text-muted mb-3">
              Normalized multi-factor merit calculation formula applied automatically by the system.
            </p>
            {scheme.meritWeights && (
              <div className="d-flex flex-column gap-2 small">
                {Object.entries(scheme.meritWeights).map(([key, weight]) => (
                  <div key={key} className="d-flex justify-content-between align-items-center bg-white p-2 rounded border">
                    <span className="text-capitalize fw-semibold">{key.replace(/_/g, ' ')}</span>
                    <Badge bg="primary">{Number(weight) * 100}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SchemeDetail;
