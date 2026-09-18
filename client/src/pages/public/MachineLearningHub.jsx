import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, ProgressBar, Spinner, Table, Alert } from 'react-bootstrap';
import axiosClient from '../../api/axiosClient';
import { Cpu, ShieldAlert, Award, CheckCircle2, TrendingUp, Sparkles, BookOpen, Layers, BarChart2 } from 'lucide-react';

const MachineLearningHub = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const [formData, setFormData] = useState({
    scheme_code: 'ARG45',
    marks_percent: 78.5,
    family_income: 250000,
    age: 24,
    gender: 'female',
    state: 'Jharkhand',
    education_level: 'masters',
    nirf_rank: 45,
    qs_rank: 999,
    has_admission_offer: true,
    is_pwd: false,
    ocr_caste_ok: true,
    ocr_income_ok: true,
    ocr_academic_ok: true,
    ocr_text_similarity: 0.96,
    income_discrepancy_ratio: 1.0,
    marks_discrepancy: 0.0,
    duplicate_cert_count: 1,
    duplicate_bank_count: 1,
    fuzzy_name_match_score: 0.98,
    certificate_tamper_flag: 0
  });

  useEffect(() => {
    const fetchModelInfo = async () => {
      try {
        const res = await axiosClient.get('/ml/model-info');
        if (res.data.success) {
          setModelInfo(res.data.metadata);
        }
      } catch (err) {
        console.error('Failed to load ML metadata:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchModelInfo();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' || type === 'range' ? Number(value) : value)
    }));
  };

  const handleRunInference = async (e) => {
    if (e) e.preventDefault();
    setPredicting(true);
    try {
      const res = await axiosClient.post('/ml/predict-custom', formData);
      if (res.data.success) {
        setPrediction(res.data.data);
      }
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      setPredicting(false);
    }
  };

  // Run initial prediction when loaded
  useEffect(() => {
    handleRunInference();
  }, []);

  return (
    <Container className="py-4">
      {/* Header Banner */}
      <div className="bg-primary bg-gradient text-white rounded-3 p-4 mb-4 shadow-sm">
        <Row className="align-items-center">
          <Col md={8}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <Cpu size={28} className="text-warning" />
              <h2 className="fw-bold mb-0">MoTA Machine Learning Intelligence Hub</h2>
            </div>
            <p className="mb-0 text-white-50">
              Trained on official MoTA scholarship guidelines (<code>tribal.nic.in</code> &amp; <code>dbttribal.gov.in</code>) using Scikit-Learn.
              Automates applicant eligibility screening, merit percentile ranking, and zero-day fraud anomaly detection.
            </p>
          </Col>
          <Col md={4} className="text-md-end mt-3 mt-md-0">
            <Badge bg="warning" text="dark" className="fs-6 px-3 py-2">
              ⚡ 4 Trained ML Models Active
            </Badge>
          </Col>
        </Row>
      </div>

      {/* Model Performance Overview Cards */}
      <Row className="g-3 mb-4">
        <Col md={3} sm={6}>
          <Card className="gov-card border-0 shadow-sm p-3 border-top border-4 border-success">
            <div className="text-muted small fw-bold">MODEL 1: ELIGIBILITY CLASSIFIER</div>
            <h3 className="fw-bold text-success mb-1">99.17%</h3>
            <div className="small text-muted">Random Forest (120 Estimators)</div>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="gov-card border-0 shadow-sm p-3 border-top border-4 border-primary">
            <div className="text-muted small fw-bold">MODEL 2: MERIT RANK REGRESSOR</div>
            <h3 className="fw-bold text-primary mb-1">R² 0.9991</h3>
            <div className="small text-muted">Gradient Boosting (150 Estimators)</div>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="gov-card border-0 shadow-sm p-3 border-top border-4 border-danger">
            <div className="text-muted small fw-bold">MODEL 3: FRAUD & ANOMALY</div>
            <h3 className="fw-bold text-danger mb-1">100.0%</h3>
            <div className="small text-muted">Isolation Forest + GBDT</div>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="gov-card border-0 shadow-sm p-3 border-top border-4 border-warning">
            <div className="text-muted small fw-bold">MODEL 4: SCHEME RECOMMENDER</div>
            <h3 className="fw-bold text-dark mb-1">86.21%</h3>
            <div className="small text-muted">Multi-Class Profile Matcher</div>
          </Card>
        </Col>
      </Row>

      {/* Interactive Live Sandbox */}
      <Row className="gy-4">
        {/* Input Parameters Form */}
        <Col lg={6}>
          <Card className="gov-card border shadow-sm p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <Sparkles size={20} className="text-primary" />
                <span>Live ML Inference Sandbox</span>
              </h5>
              <Button variant="gov-primary" size="sm" onClick={handleRunInference} disabled={predicting}>
                {predicting ? <Spinner size="sm" animation="border" /> : 'Run ML Prediction'}
              </Button>
            </div>

            <Form onSubmit={handleRunInference}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Target Scheme</Form.Label>
                    <Form.Select name="scheme_code" value={formData.scheme_code} onChange={handleChange}>
                      <option value="ARG45">NFST - National Fellowship (ARG45)</option>
                      <option value="AZKMI">NOS - National Overseas (AZKMI)</option>
                      <option value="A023B">Top Class Education (A023B)</option>
                      <option value="BVOBC">Post-Matric ST (BVOBC)</option>
                      <option value="BPVGK">Pre-Matric ST (BPVGK)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Education Level</Form.Label>
                    <Form.Select name="education_level" value={formData.education_level} onChange={handleChange}>
                      <option value="10th">10th Standard</option>
                      <option value="12th">12th Standard</option>
                      <option value="bachelors">Bachelor's Degree</option>
                      <option value="masters">Master's Degree</option>
                      <option value="phd">Ph.D. Enrolled</option>
                      <option value="postdoc">Post-Doctoral</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">
                      Academic Aggregate: <strong>{formData.marks_percent}%</strong>
                    </Form.Label>
                    <Form.Range
                      name="marks_percent"
                      min={40}
                      max={100}
                      step={0.5}
                      value={formData.marks_percent}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">
                      Annual Family Income: <strong>₹{Number(formData.family_income).toLocaleString('en-IN')}</strong>
                    </Form.Label>
                    <Form.Range
                      name="family_income"
                      min={20000}
                      max={1200000}
                      step={20000}
                      value={formData.family_income}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Age: {formData.age}</Form.Label>
                    <Form.Range name="age" min={14} max={45} value={formData.age} onChange={handleChange} />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Gender</Form.Label>
                    <Form.Select name="gender" value={formData.gender} onChange={handleChange}>
                      <option value="female">Female (30% Reservation Boost)</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Institute NIRF / QS</Form.Label>
                    <Form.Control
                      type="number"
                      name={formData.scheme_code === 'AZKMI' ? 'qs_rank' : 'nirf_rank'}
                      value={formData.scheme_code === 'AZKMI' ? formData.qs_rank : formData.nirf_rank}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <div className="p-2.5 bg-light rounded border">
                    <div className="small fw-bold text-dark mb-2">Simulated OCR Document Verifications &amp; Security:</div>
                    <Row>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          id="ocr_caste_ok"
                          name="ocr_caste_ok"
                          label="Caste Certificate Verified (OCR)"
                          checked={formData.ocr_caste_ok}
                          onChange={handleChange}
                          className="small"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          id="ocr_income_ok"
                          name="ocr_income_ok"
                          label="Income Certificate Verified (OCR)"
                          checked={formData.ocr_income_ok}
                          onChange={handleChange}
                          className="small"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          id="has_admission_offer"
                          name="has_admission_offer"
                          label="Valid Admission / Offer Letter"
                          checked={formData.has_admission_offer}
                          onChange={handleChange}
                          className="small"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          id="is_pwd"
                          name="is_pwd"
                          label="Differently Abled (PwD 5% Quota)"
                          checked={formData.is_pwd}
                          onChange={handleChange}
                          className="small"
                        />
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>

        {/* Live Predictions Result Display */}
        <Col lg={6}>
          <Card className="gov-card border shadow-sm p-4 h-100 bg-white">
            <h5 className="fw-bold text-dark mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
              <TrendingUp size={20} className="text-success" />
              <span>Real-Time ML Output &amp; Diagnostics</span>
            </h5>

            {prediction ? (
              <div className="d-flex flex-column gap-3">
                {/* 1. Eligibility Prediction */}
                <div className={`p-3 rounded-3 border ${prediction.eligibility.decision === 'Eligible' ? 'bg-success bg-opacity-10 border-success' : 'bg-danger bg-opacity-10 border-danger'}`}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small fw-bold text-muted">MODEL 1: ELIGIBILITY DECISION</span>
                    <Badge bg={prediction.eligibility.decision === 'Eligible' ? 'success' : 'danger'}>
                      {prediction.eligibility.status_tag}
                    </Badge>
                  </div>
                  <h4 className="fw-bold mb-1">
                    {prediction.eligibility.decision}
                  </h4>
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-muted">Decision Confidence:</span>
                    <ProgressBar
                      now={prediction.eligibility.confidence}
                      label={`${prediction.eligibility.confidence}%`}
                      variant={prediction.eligibility.decision === 'Eligible' ? 'success' : 'danger'}
                      className="flex-grow-1"
                      style={{ height: '18px' }}
                    />
                  </div>
                </div>

                {/* 2. Merit Score & Percentile */}
                <div className="p-3 rounded-3 border bg-primary bg-opacity-10 border-primary">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small fw-bold text-muted">MODEL 2: MERIT RANKING SCORE</span>
                    <Badge bg="primary">Prospect: {prediction.merit_assessment.seat_allocation_prospect}</Badge>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold text-primary mb-0">{prediction.merit_assessment.predicted_merit_score} / 100</h3>
                    <span className="text-muted small">
                      (Est. All-India Percentile: <strong>{prediction.merit_assessment.estimated_national_percentile}th</strong>)
                    </span>
                  </div>
                  <p className="small text-muted mb-0 mt-1">
                    Weights: 40% Academic GPA + 25% Institute NIRF/QS + 20% Income Priority + 10% Gender Equity + 5% PwD.
                  </p>
                </div>

                {/* 3. Fraud Risk Assessment */}
                <div className={`p-3 rounded-3 border ${prediction.fraud_risk_assessment.risk_level === 'Clean / Normal' ? 'bg-light border-secondary' : 'bg-danger bg-opacity-10 border-danger'}`}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small fw-bold text-muted">MODEL 3: FRAUD &amp; ANOMALY DETECTION</span>
                    <Badge bg={prediction.fraud_risk_assessment.risk_level === 'Clean / Normal' ? 'secondary' : 'danger'}>
                      {prediction.fraud_risk_assessment.risk_level}
                    </Badge>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-muted">Risk Probability:</span>
                    <strong className="text-dark">{prediction.fraud_risk_assessment.fraud_risk_score}%</strong>
                    <span className="ms-auto small text-muted">
                      {prediction.fraud_risk_assessment.is_statistical_anomaly ? '⚠️ Statistical Outlier' : '✓ Standard Pattern'}
                    </span>
                  </div>
                </div>

                {/* 4. Scheme Recommendation */}
                <div className="p-3 rounded-3 border bg-warning bg-opacity-10 border-warning">
                  <div className="small fw-bold text-dark mb-1">MODEL 4: BEST MATCH SCHEME</div>
                  <div className="fw-bold text-dark fs-6 mb-1">
                    🏆 Top Recommendation: <code>{prediction.recommendation.top_scheme_match}</code>
                  </div>
                  <div className="small text-muted">{prediction.recommendation.reason}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted small mt-2">Computing ML inference vectors...</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Feature Importance & Explainability Table */}
      {modelInfo?.featureImportances && (
        <Card className="gov-card border shadow-sm p-4 mt-4">
          <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
            <BarChart2 size={20} className="text-primary" />
            <span>Explainable AI: Feature Importance Weights in Scholarship Decisions</span>
          </h5>
          <p className="text-muted small mb-3">
            Gini importance computed across 120 decision trees in the Random Forest model trained on official MoTA scheme criteria:
          </p>

          <Row className="gy-2">
            {Object.entries(modelInfo.featureImportances).map(([feature, weight]) => {
              const pct = (weight * 100).toFixed(2);
              return (
                <Col md={6} key={feature}>
                  <div className="d-flex justify-content-between small fw-bold mb-1">
                    <span className="text-capitalize">{feature.replace(/_/g, ' ')}</span>
                    <span className="text-primary">{pct}%</span>
                  </div>
                  <ProgressBar now={pct} style={{ height: '8px' }} className="mb-2" />
                </Col>
              );
            })}
          </Row>
        </Card>
      )}
    </Container>
  );
};

export default MachineLearningHub;
