import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, CheckCircle2 } from 'lucide-react';

const VerifyOtp = () => {
  const [searchParams] = useSearchParams();
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();

  const emailParam = searchParams.get('email') || '';
  const otpDebug = searchParams.get('otpDebug') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(otpDebug);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await verifyOtp(email, otp);
      if (data.success) {
        navigate('/applicant/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="gov-card border shadow-sm p-4 text-center">
            <div className="rounded-circle bg-success bg-opacity-10 text-success d-inline-flex align-items-center justify-content-center p-3 mb-3 mx-auto" style={{ width: '64px', height: '64px' }}>
              <KeyRound size={32} />
            </div>

            <h4 className="fw-bold text-dark mb-1">Verify Mobile & Email OTP</h4>
            <p className="text-muted small mb-4">
              Enter the 6-digit verification code sent to <strong>{email || 'your mobile'}</strong>
            </p>

            {otpDebug && (
              <Alert variant="info" className="py-2 small text-start mb-3">
                <strong>Console Mock OTP:</strong> <code>{otpDebug}</code>
              </Alert>
            )}

            {error && <Alert variant="danger" className="py-2 small text-start">{error}</Alert>}

            <Form onSubmit={handleVerify}>
              <Form.Group className="mb-3 text-start">
                <Form.Label className="small fw-bold">Email Address</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4 text-start">
                <Form.Label className="small fw-bold">6-Digit OTP</Form.Label>
                <Form.Control
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 849201"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="text-center fs-4 fw-bold letter-spacing-2"
                  required
                />
              </Form.Group>

              <Button
                type="submit"
                variant="gov-primary"
                className="w-100 fw-bold py-2 shadow-sm"
                disabled={loading || otp.length < 6}
              >
                {loading ? <Spinner size="sm" animation="border" /> : 'Verify & Continue →'}
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VerifyOtp;
