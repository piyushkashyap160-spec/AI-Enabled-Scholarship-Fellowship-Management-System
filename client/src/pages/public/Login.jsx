import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Lock, Mail, ShieldCheck, Award, User, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.success) {
        const role = data.user.role;
        const redirect = location.state?.from?.pathname;
        if (redirect) {
          navigate(redirect);
        } else if (role === 'admin') {
          navigate('/admin/dashboard');
        } else if (role === 'verifier') {
          navigate('/verifier/queue');
        } else if (role === 'officer') {
          navigate('/officer/scrutiny');
        } else {
          navigate('/applicant/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password entered.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError(null);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center gy-4">
        <Col md={6} lg={5}>
          <Card className="gov-card border shadow-sm p-4">
            <div className="text-center mb-4">
              <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center p-3 mb-2">
                <Lock size={28} />
              </div>
              <h3 className="fw-bold text-dark mb-1">Ministry Portal Sign In</h3>
              <p className="text-muted small">
                Sign in with your registered ST scholar or official MotA account
              </p>
            </div>

            {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-dark">Email Address</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light"><Mail size={16} className="text-muted" /></span>
                  <Form.Control
                    type="email"
                    placeholder="e.g. scholar@example.com or name@mota.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-dark">Password</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light"><Lock size={16} className="text-muted" /></span>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </Form.Group>

              <Button
                type="submit"
                variant="gov-primary"
                className="w-100 fw-bold py-2 shadow-sm"
                disabled={loading}
              >
                {loading ? <Spinner size="sm" animation="border" /> : 'Sign In to Portal'}
              </Button>
            </Form>

            <div className="text-center mt-3 small text-muted">
              Don't have an applicant account? <Link to="/register" className="fw-bold text-primary">Register Here</Link>
            </div>
          </Card>
        </Col>

        {/* 1-Click Demo Accounts Column */}
        <Col md={6} lg={5}>
          <Card className="gov-card border p-3 bg-light">
            <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-1.5">
              <ShieldCheck size={18} className="text-primary" />
              <span>Optional Quick Test Shortcuts</span>
            </h6>
            <p className="small text-muted mb-3">
              Click any role below only if you want to test with pre-seeded evaluation accounts:
            </p>

            <div className="d-flex flex-column gap-2">
              <Button
                variant="outline-dark"
                size="sm"
                className="text-start d-flex justify-content-between align-items-center p-2 bg-white"
                onClick={() => handleQuickFill('admin@mota.gov.in', 'Admin@123')}
              >
                <div>
                  <div className="fw-bold small text-primary">👑 Ministry Admin (Full Access)</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>admin@mota.gov.in | Admin@123</div>
                </div>
                <Badge bg="primary">Admin</Badge>
              </Button>

              <Button
                variant="outline-dark"
                size="sm"
                className="text-start d-flex justify-content-between align-items-center p-2 bg-white"
                onClick={() => handleQuickFill('verifier1@mota.gov.in', 'Verifier@123')}
              >
                <div>
                  <div className="fw-bold small text-info">🔍 Document Verifier 1</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>verifier1@mota.gov.in | Verifier@123</div>
                </div>
                <Badge bg="info">Verifier</Badge>
              </Button>

              <Button
                variant="outline-dark"
                size="sm"
                className="text-start d-flex justify-content-between align-items-center p-2 bg-white"
                onClick={() => handleQuickFill('officer1@mota.gov.in', 'Officer@123')}
              >
                <div>
                  <div className="fw-bold small text-warning">⚖️ Scrutiny Officer 1</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>officer1@mota.gov.in | Officer@123</div>
                </div>
                <Badge bg="warning" text="dark">Officer</Badge>
              </Button>

              <Button
                variant="outline-dark"
                size="sm"
                className="text-start d-flex justify-content-between align-items-center p-2 bg-white"
                onClick={() => handleQuickFill('rahul.st@example.com', 'Applicant@123')}
              >
                <div>
                  <div className="fw-bold small text-success">🎓 ST Applicant (Rahul Kumar - Jharkhand)</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>rahul.st@example.com | Applicant@123</div>
                </div>
                <Badge bg="success">Applicant</Badge>
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
