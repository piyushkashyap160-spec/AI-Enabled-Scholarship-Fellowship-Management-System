import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useSearchParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import EligibilityResultCard from '../../components/EligibilityResultCard';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

const EligibilityChecker = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [schemes, setSchemes] = useState([]);
  const [selectedSchemeCode, setSelectedSchemeCode] = useState(searchParams.get('scheme') || 'NFST');
  const [formData, setFormData] = useState({
    category: 'ST',
    educationLevel: 'masters',
    course: 'M.Sc. Computer Science',
    marksPercent: 72,
    familyIncome: 450000,
    age: 26,
    country: 'India'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Load active schemes list
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await axiosClient.get('/schemes?active=true');
        if (res.data.success) {
          setSchemes(res.data.schemes || []);
        }
      } catch (e) {}
    };
    fetchSchemes();
  }, []);

  // Pre-fill profile data if user is logged in
  useEffect(() => {
    if (user?.profile) {
      setFormData(prev => ({
        ...prev,
        category: user.profile.category || 'ST',
        educationLevel: user.profile.education?.level || prev.educationLevel,
        course: user.profile.education?.course || prev.course,
        marksPercent: user.profile.education?.marksPercent || prev.marksPercent,
        familyIncome: user.profile.familyIncome || prev.familyIncome
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEvaluate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await axiosClient.post('/eligibility/check', {
        schemeCode: selectedSchemeCode,
        ...formData
      });

      if (res.data.success) {
        setResult(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to evaluate eligibility rules.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      {/* Page Title */}
      <div className="text-center mb-4">
        <span className="badge bg-warning text-dark px-3 py-1.5 fw-bold text-uppercase mb-2">
          <Sparkles size={14} className="me-1" /> Instant Public Pre-Check
        </span>
        <h2 className="fw-bold text-dark">Pre-Check Your Scheme Eligibility</h2>
        <p className="text-muted" style={{ maxWidth: '650px', margin: '0 auto' }}>
          Evaluate your profile against official Ministry of Tribal Affairs eligibility rules in real time before submitting an application. No login or long form required.
        </p>
      </div>

      <Row className="gy-4 justify-content-center">
        {/* Input Form Column */}
        <Col lg={5} md={6}>
          <Card className="gov-card p-3 border shadow-sm h-100">
            <Card.Header className="gov-card-header bg-white border-bottom pb-2">
              <h5 className="mb-0 fs-6 fw-bold text-primary">Enter Academic & Profile Details</h5>
            </Card.Header>

            <Card.Body className="p-3">
              {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

              <Form onSubmit={handleEvaluate}>
                {/* Target Scheme */}
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-dark">Select Target Scheme</Form.Label>
                  <Form.Select
                    value={selectedSchemeCode}
                    onChange={(e) => {
                      setSelectedSchemeCode(e.target.value);
                      setResult(null);
                    }}
                    required
                  >
                    <option value="NFST">NFST — National Fellowship for ST (India)</option>
                    <option value="NOS">NOS — National Overseas Scholarship (Abroad)</option>
                  </Form.Select>
                </Form.Group>

                {/* Social Category */}
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-dark">Social Category</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="ST">Scheduled Tribe (ST)</option>
                    <option value="SC">Scheduled Caste (SC)</option>
                    <option value="OBC">Other Backward Class (OBC)</option>
                    <option value="GEN">General / Unreserved</option>
                  </Form.Select>
                  <Form.Text className="text-muted small">
                    MoTA schemes are exclusively reserved for ST scholars.
                  </Form.Text>
                </Form.Group>

                {/* Education Level */}
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-dark">Current / Qualifying Education Level</Form.Label>
                  <Form.Select
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={handleChange}
                    required
                  >
                    <option value="masters">Master's / Post-Graduate</option>
                    <option value="phd">Ph.D. / Doctoral Research</option>
                    <option value="bachelors">Bachelor's / Under-Graduate</option>
                    <option value="12th">Higher Secondary (12th)</option>
                  </Form.Select>
                </Form.Group>

                {/* Course Name */}
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-dark">Degree Programme / Specialization</Form.Label>
                  <Form.Control
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                {/* Marks Percent */}
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-dark">Qualifying Degree Aggregate Marks (%)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="30"
                    max="100"
                    name="marksPercent"
                    value={formData.marksPercent}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                {/* Family Income */}
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-dark">Total Annual Family Income (INR)</Form.Label>
                  <Form.Control
                    type="number"
                    step="5000"
                    min="0"
                    name="familyIncome"
                    value={formData.familyIncome}
                    onChange={handleChange}
                    required
                  />
                  <Form.Text className="text-muted small">
                    As stated in Revenue Authority income certificate.
                  </Form.Text>
                </Form.Group>

                {/* Age */}
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-dark">Applicant Age (Years)</Form.Label>
                  <Form.Control
                    type="number"
                    min="18"
                    max="60"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="gov-primary"
                  className="w-100 fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" animation="border" /> Evaluating Rules Engine…
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} /> Evaluate Eligibility Rules
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Results Breakdown Column */}
        <Col lg={7} md={6}>
          {result ? (
            <div>
              <EligibilityResultCard
                isEligible={result.isEligible}
                summary={result.summary}
                criteriaResults={result.criteriaResults}
                alternativeSchemes={result.alternativeSchemes}
                schemeName={result.scheme?.name || selectedSchemeCode}
              />

              {result.isEligible && (
                <div className="p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <div className="fw-bold text-success fs-6">You meet all eligibility criteria!</div>
                    <div className="small text-secondary">Proceed to register or log in to submit your online application.</div>
                  </div>
                  <Link
                    to={user ? `/applicant/applications/new?schemeId=${result.scheme?.id}` : `/register?schemeId=${result.scheme?.id}`}
                    className="btn btn-success fw-bold px-4"
                  >
                    Start Application →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <Card className="gov-card p-4 border text-center text-muted h-100 d-flex align-items-center justify-content-center bg-light">
              <Sparkles size={48} className="text-warning mb-3 opacity-75" />
              <h5 className="fw-bold text-dark">Awaiting Evaluation Input</h5>
              <p className="small mb-0" style={{ maxWidth: '400px' }}>
                Fill in your academic and family parameters on the left and click <strong>Evaluate Eligibility Rules</strong> to view a criterion-by-criterion assessment.
              </p>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default EligibilityChecker;
