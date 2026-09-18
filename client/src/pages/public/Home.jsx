import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import axiosClient from '../../api/axiosClient';
import {
  Award, Globe, ShieldCheck, Sparkles, CheckCircle2, ArrowRight,
  FileText, Cpu, Clock, Check, Users, ChevronLeft, ChevronRight,
  GraduationCap, Landmark, BookOpen, Layers, CheckCircle, ExternalLink,
  ChevronDown, ChevronUp, ArrowDownRight, Compass, Shield
} from 'lucide-react';

const Home = () => {
  const { t, lang } = useLanguage();

  const [schemes, setSchemes] = useState([]);
  const [loadingSchemes, setLoadingSchemes] = useState(true);
  const [showAllSchemes, setShowAllSchemes] = useState(false);

  // 5-Second Rotating Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const heroSlides = [
    {
      id: 1,
      tag: 'FLAGSHIP CENTRAL SECTOR SCHEME (ARG45)',
      badgeVariant: 'warning',
      badgeColor: '#FF9933',
      title: 'National Fellowship for ST Students (NFST)',
      tagline: 'Empowering Scheduled Tribe Research Scholars in India',
      subtitle: 'Direct financial fellowship for M.Phil & Ph.D. scholars in Indian Universities, IITs, NITs, and National Research Laboratories with ₹31,000–₹35,000/mo stipend + contingency.',
      stats: [
        { label: 'Annual Fellowships', value: '750 Seats' },
        { label: 'JRF Stipend Support', value: '₹3.84L / yr' },
        { label: 'Women Reservation', value: '30% Quota' }
      ],
      preCheckCode: 'ARG45',
      image: '/images/hero/slide_nfst.jpg',
      floatingBadges: [
        { position: 'top-left', text: '🎓 750 Annual Fellowships', color: '#10b981' },
        { position: 'bottom-right', text: '🔬 Indian Universities & IITs', color: '#38bdf8' }
      ],
      icon: Award
    },
    {
      id: 2,
      tag: 'GLOBAL HIGHER STUDIES SCHEME (AZKMI)',
      badgeVariant: 'info',
      badgeColor: '#38bdf8',
      title: 'National Overseas Scholarship for ST Students (NOS)',
      tagline: 'Study Abroad at World Top 500 QS Universities',
      subtitle: '100% full international tuition fee reimbursement + annual living allowance ($15,400 USD / £9,900 GBP) + airfare for Master\'s and Ph.D. programmes abroad.',
      stats: [
        { label: 'Annual Overseas Slots', value: '100 Seats' },
        { label: 'Max Family Income', value: '≤ ₹6.00 Lakhs' },
        { label: 'QS University Rank', value: 'Top 500 Global' }
      ],
      preCheckCode: 'AZKMI',
      image: '/images/hero/slide_nos.jpg',
      floatingBadges: [
        { position: 'top-left', text: '✈️ Oxford, MIT & Harvard', color: '#f59e0b' },
        { position: 'bottom-right', text: '🌍 100 Overseas Slots', color: '#38bdf8' }
      ],
      icon: Globe
    },
    {
      id: 3,
      tag: 'PREMIER INSTITUTES SCHEME (A023B)',
      badgeVariant: 'success',
      badgeColor: '#22c55e',
      title: 'Top Class Education for ST Students',
      tagline: 'Full Fee Support in 265+ Premier Indian Institutes',
      subtitle: 'Full tuition fee reimbursement + ₹3,000/mo living expense + ₹45,000 one-time computer/hardware grant for ST scholars admitted in IITs, IIMs, AIIMS, NITs, and NLUs.',
      stats: [
        { label: 'Notified Institutes', value: '265+ Premier' },
        { label: 'Hardware Grant', value: '₹45,000 One-Time' },
        { label: 'Annual ST Intake', value: '1,000+ Slots' }
      ],
      preCheckCode: 'A023B',
      image: '/images/hero/slide_topclass.jpg',
      floatingBadges: [
        { position: 'top-left', text: '💻 ₹45,000 Hardware Grant', color: '#6366f1' },
        { position: 'bottom-right', text: '🏛️ IIT, IIM, AIIMS, NIT', color: '#10b981' }
      ],
      icon: GraduationCap
    },
    {
      id: 4,
      tag: 'CENTRALLY SPONSORED DBT (BVOBC & BPVGK)',
      badgeVariant: 'warning',
      badgeColor: '#eab308',
      title: 'Post-Matric & Pre-Matric ST Scholarships',
      tagline: 'Direct Benefit Transfer for School & College ST Scholars',
      subtitle: 'Direct Benefit Transfer (DBT) assistance for Class 9th, 10th, 11th, 12th, and College/University ST students across all Indian States & UTs to eliminate transition dropouts.',
      stats: [
        { label: 'Disbursement Mode', value: '100% Cash DBT' },
        { label: 'Income Limit', value: '≤ ₹2.50 Lakhs' },
        { label: 'Coverage', value: 'All 28 States & UTs' }
      ],
      preCheckCode: 'BVOBC',
      image: '/images/hero/slide_matric.jpg',
      floatingBadges: [
        { position: 'top-left', text: '📱 100% Cash DBT to Bank', color: '#10b981' },
        { position: 'bottom-right', text: '👨‍👩‍👧 Class 9 to 12 & Degree', color: '#eab308' }
      ],
      icon: Landmark
    },
    {
      id: 5,
      tag: 'SMART INDIA HACKATHON 2026 | PS 26239',
      badgeVariant: 'danger',
      badgeColor: '#ec4899',
      title: 'AI-Enabled Scholarship & Fellowship Platform',
      tagline: 'Offline OCR, Fraud Detection & Explainable Decision Support',
      subtitle: 'Local offline OCR extracts documents in seconds. Multi-class Machine Learning models predict eligibility with 99.17% accuracy and generate merit rankings with full human-in-the-loop audit trails.',
      stats: [
        { label: 'Document OCR', value: '100% Offline' },
        { label: 'ML Accuracy', value: '99.17% (Trained)' },
        { label: 'Decision Audit', value: '100% Immutable' }
      ],
      preCheckCode: 'ARG45',
      image: '/images/hero/slide_ai_model.jpg',
      floatingBadges: [
        { position: 'top-left', text: '🧠 99.17% ML Accuracy', color: '#a855f7' },
        { position: 'bottom-right', text: '🛡️ 100% Secure & Audited', color: '#10b981' }
      ],
      icon: Cpu
    }
  ];

  // Fetch schemes from database
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await axiosClient.get('/schemes?active=true');
        if (res.data.success && res.data.schemes?.length > 0) {
          setSchemes(res.data.schemes);
        }
      } catch (err) {
        console.error('Failed to load schemes:', err);
      } finally {
        setLoadingSchemes(false);
      }
    };
    fetchSchemes();
  }, []);

  // Auto-rotating 5-Second Carousel Timer
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, heroSlides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  const activeSlide = heroSlides[currentSlide];
  const IconComponent = activeSlide.icon;

  const scrollToSchemes = (e) => {
    e.preventDefault();
    const elem = document.getElementById('schemes-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="home-page">
      {/* FULL VIEWPORT 5-SECOND HERO DASHBOARD (Inspired by myScheme layout) */}
      <section
        className="hero-full-viewport text-white"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Animated 5-Second Progress Bar at Top */}
        <div className="carousel-progress-bar">
          <div
            key={currentSlide}
            className="carousel-progress-fill"
            style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
          />
        </div>

        {/* Decorative Dotted Grid in Background */}
        <div className="decorative-dot-grid top-right" />
        <div className="decorative-dot-grid bottom-left" />

        {/* Main Hero Content Area */}
        <Container className="my-auto py-4 position-relative z-1">
          <Row className="align-items-center gy-4">
            {/* Left Column: Scheme / AI Model Information */}
            <Col lg={7} key={activeSlide.id} className="slide-fade-enter">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Badge
                  bg={activeSlide.badgeVariant}
                  text="dark"
                  className="px-3 py-1.5 fw-bold text-uppercase shadow-sm"
                  style={{ letterSpacing: '0.6px', fontSize: '0.82rem' }}
                >
                  {activeSlide.tag}
                </Badge>
                {isPaused && (
                  <Badge bg="secondary" className="small">⏸ Paused on hover</Badge>
                )}
              </div>

              <h1 className="display-5 fw-extrabold text-white mb-2" style={{ lineHeight: '1.2', fontWeight: 800 }}>
                {activeSlide.title}
              </h1>

              <h5 className="text-warning fw-semibold mb-3 opacity-90" style={{ fontSize: '1.15rem' }}>
                {activeSlide.tagline}
              </h5>

              <p className="lead text-white-50 mb-4" style={{ maxWidth: '640px', lineHeight: '1.6', fontSize: '1.05rem' }}>
                {activeSlide.subtitle}
              </p>

              {/* Dynamic Slide Highlight Stats */}
              <div className="row g-2.5 mb-4" style={{ maxWidth: '580px' }}>
                {activeSlide.stats.map((s, idx) => (
                  <div className="col-4" key={idx}>
                    <div className="p-2.5 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-15 text-center shadow-sm backdrop-blur">
                      <div className="text-warning fw-bold fs-6">{s.value}</div>
                      <div className="text-white-50 small" style={{ fontSize: '0.74rem' }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap gap-3 align-items-center">
                <Link
                  to={`/eligibility?scheme=${activeSlide.preCheckCode}`}
                  className="btn btn-warning btn-lg fw-bold px-4 py-2.5 shadow text-dark d-inline-flex align-items-center gap-2"
                >
                  <Sparkles size={20} /> Pre-Check Eligibility
                </Link>

                <Link
                  to="/schemes"
                  className="btn btn-outline-light btn-lg fw-semibold px-4 py-2.5 d-inline-flex align-items-center gap-2"
                >
                  Explore All 5 Schemes <ArrowRight size={18} />
                </Link>

                <Link
                  to="/ml-hub"
                  className="btn btn-outline-info btn-lg fw-semibold px-3 py-2.5 d-inline-flex align-items-center gap-2"
                >
                  <Cpu size={18} /> AI / ML Sandbox
                </Link>
              </div>
            </Col>

            {/* Right Column: 3D Dazzling Interactive Visual Artwork */}
            <Col lg={5}>
              <div className="hero-3d-frame-wrapper">
                {/* Floating 3D Badges */}
                {activeSlide.floatingBadges.map((badge, bIdx) => (
                  <div
                    key={bIdx}
                    className={`floating-3d-badge ${badge.position}`}
                    style={{ borderLeft: `4px solid ${badge.color}` }}
                  >
                    <span>{badge.text}</span>
                  </div>
                ))}

                {/* 3D Image Card */}
                <div className="hero-3d-image-card">
                  <img
                    src={activeSlide.image}
                    alt={activeSlide.title}
                    loading="eager"
                  />
                  {/* Subtle Gradient Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, transparent 65%, rgba(15, 23, 42, 0.7) 100%)',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Slide Selector & Navigation Controls */}
              <div className="d-flex justify-content-between align-items-center mt-4 px-2">
                {/* Dotted Navigation */}
                <div className="d-flex align-items-center gap-2">
                  {heroSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`btn p-0 border-0 ${currentSlide === idx ? 'bg-warning' : 'bg-white bg-opacity-35'}`}
                      style={{
                        width: currentSlide === idx ? '28px' : '10px',
                        height: '10px',
                        borderRadius: '5px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                  <span className="small text-white-50 ms-2" style={{ fontSize: '0.8rem' }}>
                    0{currentSlide + 1} / 0{heroSlides.length}
                  </span>
                </div>

                {/* Next / Previous Arrow Chevrons */}
                <div className="d-flex gap-1.5">
                  <button
                    onClick={prevSlide}
                    className="btn btn-sm btn-outline-light rounded-circle p-2 d-flex align-items-center justify-content-center"
                    style={{ width: '36px', height: '36px' }}
                    aria-label="Previous slide"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="btn btn-sm btn-outline-light rounded-circle p-2 d-flex align-items-center justify-content-center"
                    style={{ width: '36px', height: '36px' }}
                    aria-label="Next slide"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>

        {/* BOTTOM HASHTAG & "FIND SCHEMES FOR YOU" SCROLL BAR (myScheme pattern) */}
        <div className="hero-bottom-tag-strip">
          <div className="small text-white-50 text-uppercase fw-bold mb-2.5" style={{ letterSpacing: '2.5px', fontSize: '0.82rem' }}>
            #GOVERNMENTSCHEMES &nbsp;•&nbsp; #SCHEMESFORYOU &nbsp;•&nbsp; #TRIBALWELFARE &nbsp;•&nbsp; #DIGITALINDIA
          </div>
          <a
            href="#schemes-section"
            onClick={scrollToSchemes}
            className="find-schemes-pill-btn shadow-lg"
          >
            Find Schemes For You <ChevronDown size={20} className="animate-bounce" />
          </a>
        </div>
      </section>

      {/* LIVE REAL-TIME METRICS COUNTER STRIP (Generous Padding & Cards) */}
      <div className="stats-counter-strip">
        <Container>
          <Row className="text-center g-3 g-lg-4 justify-content-center">
            <Col lg={2} md={4} sm={6} xs={6}>
              <div className="stat-metric-card">
                <div className="stat-metric-number text-primary">5</div>
                <div className="stat-metric-label">Active MoTA Schemes</div>
              </div>
            </Col>
            <Col lg={2} md={4} sm={6} xs={6}>
              <div className="stat-metric-card">
                <div className="stat-metric-number text-success">750</div>
                <div className="stat-metric-label">NFST Fellowships / yr</div>
              </div>
            </Col>
            <Col lg={2} md={4} sm={6} xs={6}>
              <div className="stat-metric-card">
                <div className="stat-metric-number text-info">100</div>
                <div className="stat-metric-label">NOS Overseas Seats</div>
              </div>
            </Col>
            <Col lg={2} md={4} sm={6} xs={6}>
              <div className="stat-metric-card">
                <div className="stat-metric-number text-warning">265+</div>
                <div className="stat-metric-label">Premier Institutes</div>
              </div>
            </Col>
            <Col lg={2} md={4} sm={6} xs={6}>
              <div className="stat-metric-card">
                <div className="stat-metric-number text-danger">₹32K/mo</div>
                <div className="stat-metric-label">JRF Research Stipend</div>
              </div>
            </Col>
            <Col lg={2} md={4} sm={6} xs={6}>
              <div className="stat-metric-card">
                <div className="stat-metric-number text-dark">100%</div>
                <div className="stat-metric-label">DBT / Audit Verified</div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* ALL 5 OFFICIAL GOVERNMENT SCHEMES SHOWCASE */}
      <Container id="schemes-section" className="py-5">
        <div className="text-center mb-5">
          <Badge bg="primary" className="px-3 py-1.5 text-uppercase fw-bold mb-2">
            Ministry of Tribal Affairs Official Schemes
          </Badge>
          <h2 className="fw-bold text-dark">Official Higher Education &amp; Fellowship Schemes</h2>
          <p className="text-muted" style={{ maxWidth: '680px', margin: '0 auto' }}>
            Extracted from official portals (<code>tribal.nic.in</code> &amp; <code>dbttribal.gov.in</code>). Transparent criteria, objective evaluation, and Direct Benefit Transfer (DBT) delivery.
          </p>
        </div>

        {loadingSchemes ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted small mt-2">Loading official schemes...</p>
          </div>
        ) : (
          <>
            <Row className="gy-4">
              {(showAllSchemes ? schemes : schemes.slice(0, 3)).map((scheme) => (
                <Col lg={4} md={6} key={scheme._id || scheme.code} className="slide-fade-enter">
                  <Card className="gov-card h-100 border p-3 shadow-sm d-flex flex-column">
                    <Card.Body className="d-flex flex-column p-2">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Badge bg="primary" className="px-2.5 py-1 text-uppercase fw-bold">
                          {scheme.code}
                        </Badge>
                        <Badge bg="success" className="px-2 py-1">
                          {scheme.schemeType || 'Central Scheme'}
                        </Badge>
                      </div>

                      <h5 className="fw-bold text-dark mb-2" style={{ minHeight: '48px' }}>
                        {scheme.name}
                      </h5>

                      <p className="text-secondary small flex-grow-1 mb-3" style={{ lineHeight: '1.5', minHeight: '65px' }}>
                        {scheme.description?.length > 130
                          ? `${scheme.description.substring(0, 130)}...`
                          : scheme.description}
                      </p>

                      <div className="bg-light p-2.5 rounded mb-3 small">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Target Level:</span>
                          <strong className="text-capitalize text-dark">{scheme.level}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Benefit Mode:</span>
                          <strong className="text-success">{scheme.benefitType || 'In Cash (DBT)'}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Annual Grant / Seats:</span>
                          <strong className="text-primary">{scheme.totalSeats ? `${scheme.totalSeats} Seats` : 'Entitlement'}</strong>
                        </div>
                      </div>

                      <div className="d-flex gap-2 mt-auto">
                        <Link
                          to={`/eligibility?scheme=${scheme.code}`}
                          className="btn btn-outline-primary btn-sm flex-fill fw-semibold"
                        >
                          Pre-Check
                        </Link>
                        <Link
                          to={`/schemes/${scheme._id}`}
                          className="btn btn-gov-primary btn-sm flex-fill fw-semibold d-inline-flex align-items-center justify-content-center gap-1"
                        >
                          Details <ArrowRight size={14} />
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {schemes.length > 3 && (
              <div className="see-more-schemes-container">
                <button
                  type="button"
                  onClick={() => setShowAllSchemes(prev => !prev)}
                  className="see-more-schemes-btn"
                >
                  {showAllSchemes ? (
                    <>
                      Show Fewer Schemes <ChevronUp size={18} className="arrow-icon" />
                    </>
                  ) : (
                    <>
                      See More Schemes ({schemes.length - 3} More) <ArrowRight size={18} className="arrow-icon" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </Container>

      {/* 4-STEP EASY APPLICATION PROCESS ("HOW IT WORKS") */}
      <div className="bg-light py-5 border-top border-bottom">
        <Container>
          <div className="text-center mb-5">
            <Badge bg="warning" text="dark" className="px-3 py-1 text-uppercase fw-bold mb-2">
              Simple 4-Step Workflow
            </Badge>
            <h2 className="fw-bold text-dark">How to Avail MoTA Scholarships &amp; Fellowships</h2>
            <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto' }}>
              Transparent, automated, and hassle-free journey from eligibility pre-check to direct bank disbursement.
            </p>
          </div>

          <Row className="gy-4">
            <Col md={3} sm={6}>
              <Card className="gov-card p-3 h-100 border text-center">
                <div
                  className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mx-auto mb-3 shadow"
                  style={{ width: '56px', height: '56px' }}
                >
                  <Sparkles size={24} />
                </div>
                <h5 className="fw-bold fs-6 mb-2">1. Eligibility Pre-Check</h5>
                <p className="small text-secondary mb-0">
                  Instantly verify criteria against official MoTA rules with green ticks without needing to register or login.
                </p>
              </Card>
            </Col>

            <Col md={3} sm={6}>
              <Card className="gov-card p-3 h-100 border text-center">
                <div
                  className="rounded-circle bg-info text-white d-inline-flex align-items-center justify-content-center mx-auto mb-3 shadow"
                  style={{ width: '56px', height: '56px' }}
                >
                  <Cpu size={24} />
                </div>
                <h5 className="fw-bold fs-6 mb-2">2. Offline AI OCR Scan</h5>
                <p className="small text-secondary mb-0">
                  Upload certificates and marksheets. Local offline OCR extracts data, detects tampering, and validates in seconds.
                </p>
              </Card>
            </Col>

            <Col md={3} sm={6}>
              <Card className="gov-card p-3 h-100 border text-center">
                <div
                  className="rounded-circle bg-warning text-dark d-inline-flex align-items-center justify-content-center mx-auto mb-3 shadow"
                  style={{ width: '56px', height: '56px' }}
                >
                  <ShieldCheck size={24} />
                </div>
                <h5 className="fw-bold fs-6 mb-2">3. Transparent Scrutiny</h5>
                <p className="small text-secondary mb-0">
                  AI flags discrepancies for human verifiers. Merit scoring allocates 750 NFST and 100 NOS slots with gender quotas.
                </p>
              </Card>
            </Col>

            <Col md={3} sm={6}>
              <Card className="gov-card p-3 h-100 border text-center">
                <div
                  className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center mx-auto mb-3 shadow"
                  style={{ width: '56px', height: '56px' }}
                >
                  <Award size={24} />
                </div>
                <h5 className="fw-bold fs-6 mb-2">4. Direct DBT Grant</h5>
                <p className="small text-secondary mb-0">
                  Monthly research stipends and tuition grants disbursed directly to verified Aadhaar-seeded bank accounts via DBT.
                </p>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* ABOUT MINISTRY OF TRIBAL AFFAIRS SECTION */}
      <Container className="py-5">
        <Row className="align-items-center gy-4">
          <Col lg={7}>
            <Badge bg="primary" className="px-3 py-1 text-uppercase fw-bold mb-2">About the Ministry</Badge>
            <h2 className="fw-bold text-dark mb-3">Empowering Tribal Youth Across India</h2>
            <p className="text-secondary" style={{ lineHeight: '1.7' }}>
              The <strong>Ministry of Tribal Affairs (MoTA)</strong> was constituted in 1999 with the objective of providing a focused approach towards the integrated socio-economic development and educational empowerment of Scheduled Tribes (STs) in India.
            </p>
            <p className="text-secondary" style={{ lineHeight: '1.7' }}>
              Under the visionary Smart India Hackathon initiative (PS 26239), this AI-Enabled Scholarship &amp; Fellowship Management System modernizes scholarship delivery with offline OCR, automated eligibility simulation, machine learning diagnostics, and 100% human-in-the-loop transparent decision audit trails.
            </p>

            <div className="d-flex flex-wrap gap-3 mt-4">
              <Link to="/schemes" className="btn btn-gov-primary fw-semibold px-4 py-2">
                Browse All 5 Schemes
              </Link>
              <Link to="/ml-hub" className="btn btn-outline-dark fw-semibold px-4 py-2">
                Explore Machine Learning Intelligence
              </Link>
            </div>
          </Col>

          <Col lg={5}>
            <Card className="gov-card p-4 border shadow-sm bg-light">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <ShieldCheck size={22} className="text-primary" />
                <span>Core Governance Pillars</span>
              </h5>
              <div className="d-flex flex-column gap-3 small">
                <div className="d-flex align-items-start gap-2.5">
                  <CheckCircle className="text-success flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <strong>Data-Driven Scheme Rules:</strong> Rules stored as data in MongoDB. Zero code deployments needed to update income caps or marks criteria.
                  </div>
                </div>
                <div className="d-flex align-items-start gap-2.5">
                  <CheckCircle className="text-success flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <strong>100% Offline Privacy:</strong> OCR runs locally inside Node.js. No student documents ever leave the secure government environment.
                  </div>
                </div>
                <div className="d-flex align-items-start gap-2.5">
                  <CheckCircle className="text-success flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <strong>Human-in-the-Loop AI:</strong> The system automatically extracts, evaluates, and flags, but a designated Ministry Officer always makes the final award decision.
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Home;
