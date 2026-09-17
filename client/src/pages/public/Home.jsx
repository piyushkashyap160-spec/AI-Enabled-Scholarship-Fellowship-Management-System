import React from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Award, Globe, ShieldCheck, Sparkles, CheckCircle2, ArrowRight, FileText, Cpu, Clock, Check, Users } from 'lucide-react';

const Home = () => {
  const { t, lang } = useLanguage();

  return (
    <div className="home-page">
      {/* Hero Banner */}
      <div className="gov-header-bg text-white py-5 position-relative overflow-hidden">
        <Container className="py-4 position-relative z-1">
          <Row className="align-items-center gy-4">
            <Col lg={8}>
              <Badge bg="warning" text="dark" className="px-3 py-1.5 fw-bold text-uppercase mb-3" style={{ letterSpacing: '0.5px' }}>
                Smart India Hackathon 2026 | PS 26239
              </Badge>
              <h1 className="display-5 fw-extrabold text-white mb-3" style={{ lineHeight: '1.2' }}>
                {lang === 'hi'
                  ? 'अनुसूचित जनजाति के छात्रों के लिए एआई-सक्षम छात्रवृत्ति एवं फैलोशिप पोर्टल'
                  : 'AI-Enabled Scholarship & Fellowship Management System'}
              </h1>
              <p className="lead text-white-50 mb-4" style={{ maxWidth: '680px', lineHeight: '1.6' }}>
                A digital governance platform designed for the <strong>Ministry of Tribal Affairs, Government of India</strong>. Automating document verification, real-time eligibility pre-check, and transparent merit listing for NFST and NOS schemes.
              </p>

              <div className="d-flex flex-wrap gap-3">
                <Link to="/eligibility" className="btn btn-warning btn-lg fw-bold px-4 py-2.5 shadow text-dark d-inline-flex align-items-center gap-2">
                  <Sparkles size={20} /> {t('buttons.check_eligibility', 'Check Your Eligibility')}
                </Link>
                <Link to="/schemes" className="btn btn-outline-light btn-lg fw-semibold px-4 py-2.5 d-inline-flex align-items-center gap-2">
                  Explore Schemes <ArrowRight size={18} />
                </Link>
              </div>
            </Col>

            <Col lg={4}>
              <Card className="bg-white bg-opacity-10 border border-white border-opacity-25 text-white p-3 rounded-4 shadow-lg backdrop-blur">
                <Card.Body>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <ShieldCheck className="text-warning" size={28} />
                    <h5 className="mb-0 text-white fw-bold">Governing Principle</h5>
                  </div>
                  <p className="small text-white-75 mb-3" style={{ lineHeight: '1.5' }}>
                    "The AI extracts, checks, flags and explains. A human officer always makes the final decision."
                  </p>
                  <div className="d-flex flex-column gap-2 small">
                    <div className="d-flex align-items-center gap-2">
                      <Check className="text-success" size={16} /> Local Offline OCR (No External API)
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Check className="text-success" size={16} /> Configurable Data-Driven Rules
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Check className="text-success" size={16} /> Full Government Audit Trail
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Live Counter Strip */}
      <div className="bg-white border-bottom py-3 shadow-sm">
        <Container>
          <Row className="text-center gy-3">
            <Col md={3} xs={6} className="border-end">
              <div className="fs-3 fw-bold text-primary">750+</div>
              <div className="small text-muted fw-semibold">NFST Annual Fellowships</div>
            </Col>
            <Col md={3} xs={6} className="border-end">
              <div className="fs-3 fw-bold text-success">100</div>
              <div className="small text-muted fw-semibold">NOS Overseas Seats</div>
            </Col>
            <Col md={3} xs={6} className="border-end">
              <div className="fs-3 fw-bold text-warning">₹32,000 / mo</div>
              <div className="small text-muted fw-semibold">JRF Research Stipend</div>
            </Col>
            <Col md={3} xs={6}>
              <div className="fs-3 fw-bold text-info">100%</div>
              <div className="small text-muted fw-semibold">Audit Logging on Decisions</div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Flagship Schemes Section */}
      <Container className="py-5">
        <div className="text-center mb-5">
          <Badge bg="primary" className="px-3 py-1 text-uppercase fw-bold mb-2">MoTA Flagship Schemes</Badge>
          <h2 className="fw-bold text-dark">Empowering ST Scholars in India and Abroad</h2>
          <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Discover our premier fellowship and scholarship programmes with transparent criteria and automated verification.
          </p>
        </div>

        <Row className="gy-4">
          {/* NFST Scheme Card */}
          <Col md={6}>
            <Card className="gov-card h-100 border p-3">
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="rounded-3 p-2.5 bg-primary bg-opacity-10 text-primary">
                    <Award size={32} />
                  </div>
                  <Badge bg="success" className="px-2.5 py-1">Applications Open</Badge>
                </div>
                <h4 className="fw-bold text-dark mb-1">NFST — National Fellowship for ST</h4>
                <div className="text-muted small mb-3">For M.Phil and Ph.D Scholars in Indian Universities</div>
                <p className="text-secondary small flex-grow-1" style={{ lineHeight: '1.6' }}>
                  Provides financial fellowship to Scheduled Tribe students pursuing regular and full-time higher research programmes in Indian Universities, IITs, NITs, and Institutes of National Eminence.
                </p>

                <div className="bg-light p-2.5 rounded mb-3 small">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Max Income Cap:</span>
                    <strong className="text-dark">₹8,00,000 / year</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Min Marks (PG):</span>
                    <strong className="text-dark">55%</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Total Annual Seats:</span>
                    <strong className="text-dark">750 Fellowships</strong>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <Link to="/eligibility?scheme=NFST" className="btn btn-outline-primary btn-sm flex-fill fw-semibold">
                    Pre-Check Eligibility
                  </Link>
                  <Link to="/register" className="btn btn-gov-primary btn-sm flex-fill fw-semibold">
                    Apply Now →
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* NOS Scheme Card */}
          <Col md={6}>
            <Card className="gov-card h-100 border p-3">
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="rounded-3 p-2.5 bg-warning bg-opacity-10 text-warning">
                    <Globe size={32} />
                  </div>
                  <Badge bg="success" className="px-2.5 py-1">Applications Open</Badge>
                </div>
                <h4 className="fw-bold text-dark mb-1">NOS — National Overseas Scholarship</h4>
                <div className="text-muted small mb-3">For Master's & Ph.D Studies in Top Foreign Universities</div>
                <p className="text-secondary small flex-grow-1" style={{ lineHeight: '1.6' }}>
                  Offers comprehensive financial support including international tuition fees, annual living allowance, airfare and health insurance for ST students studying abroad in UK, US, Australia, Canada and Germany.
                </p>

                <div className="bg-light p-2.5 rounded mb-3 small">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Max Income Cap:</span>
                    <strong className="text-dark">₹8,00,000 / year</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Min Marks (Graduation):</span>
                    <strong className="text-dark">60%</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Total Annual Seats:</span>
                    <strong className="text-dark">100 Overseas Seats</strong>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <Link to="/eligibility?scheme=NOS" className="btn btn-outline-primary btn-sm flex-fill fw-semibold">
                    Pre-Check Eligibility
                  </Link>
                  <Link to="/register" className="btn btn-gov-primary btn-sm flex-fill fw-semibold">
                    Apply Now →
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* How the System Works */}
      <div className="bg-light py-5 border-top border-bottom">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold text-dark">The End-to-End Digital Journey</h2>
            <p className="text-muted">From scheme discovery to fellowship disbursement in four transparent steps.</p>
          </div>

          <Row className="gy-4">
            <Col md={3} sm={6}>
              <div className="text-center p-3">
                <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3 shadow" style={{ width: '56px', height: '56px' }}>
                  <Sparkles size={24} />
                </div>
                <h5 className="fw-bold fs-6">1. Eligibility Pre-Check</h5>
                <p className="small text-secondary">
                  Instant criterion-by-criterion rule evaluation without needing to log in or fill long forms.
                </p>
              </div>
            </Col>

            <Col md={3} sm={6}>
              <div className="text-center p-3">
                <div className="rounded-circle bg-info text-white d-inline-flex align-items-center justify-content-center mb-3 shadow" style={{ width: '56px', height: '56px' }}>
                  <Cpu size={24} />
                </div>
                <h5 className="fw-bold fs-6">2. Offline AI OCR</h5>
                <p className="small text-secondary">
                  Local OCR extracts certificate attributes, classifies documents, and flags mismatches instantly.
                </p>
              </div>
            </Col>

            <Col md={3} sm={6}>
              <div className="text-center p-3">
                <div className="rounded-circle bg-warning text-dark d-inline-flex align-items-center justify-content-center mb-3 shadow" style={{ width: '56px', height: '56px' }}>
                  <ShieldCheck size={24} />
                </div>
                <h5 className="fw-bold fs-6">3. Officer Scrutiny</h5>
                <p className="small text-secondary">
                  Human verifiers and officers review flags, resolve deficiencies, and make final decisions.
                </p>
              </div>
            </Col>

            <Col md={3} sm={6}>
              <div className="text-center p-3">
                <div className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center mb-3 shadow" style={{ width: '56px', height: '56px' }}>
                  <Award size={24} />
                </div>
                <h5 className="fw-bold fs-6">4. Merit & DBT PFMS</h5>
                <p className="small text-secondary">
                  Automated merit ranking with horizontal reservation quotas and Direct Benefit Transfer tracking.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Home;
