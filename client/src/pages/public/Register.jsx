import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, ShieldCheck } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    gender: '',
    dob: '',
    state: '',
    district: '',
    educationLevel: '',
    course: '',
    university: '',
    marksPercent: '',
    familyIncome: '',
    bankAccount: '',
    ifsc: '',
    aadhaarLast4: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim() || formData.firstName || formData.email.split('@')[0];
      const payload = {
        name: fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: 'applicant',
        profile: {
          dob: formData.dob || undefined,
          gender: formData.gender,
          category: 'ST',
          state: formData.state,
          district: formData.district,
          aadhaarLast4: formData.aadhaarLast4,
          familyIncome: formData.familyIncome ? Number(formData.familyIncome) : 0,
          bankAccount: formData.bankAccount,
          ifsc: formData.ifsc,
          education: {
            level: formData.educationLevel,
            course: formData.course,
            university: formData.university,
            marksPercent: formData.marksPercent ? Number(formData.marksPercent) : 0,
            yearOfPassing: new Date().getFullYear()
          }
        }
      };

      const res = await register(payload);
      if (res.success) {
        navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}&otpDebug=${res.otpDebug || ''}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8} md={10}>
          <Card className="gov-card border shadow-sm p-4">
            <div className="text-center mb-4">
              <div className="rounded-circle bg-warning bg-opacity-25 text-dark d-inline-flex align-items-center justify-content-center p-3 mb-2">
                <UserPlus size={28} />
              </div>
              <h3 className="fw-bold text-dark mb-1">ST Scholar Registration</h3>
              <p className="text-muted small">
                Create your Scheduled Tribe Scholar account for NFST and NOS online applications
              </p>
            </div>

            {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Row className="gy-3">
                {/* Account Details */}
                <Col md={12}>
                  <h6 className="fw-bold text-primary border-bottom pb-1 mb-2">1. Personal & Contact Information</h6>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">First Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="firstName"
                      placeholder="e.g. Rahul"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="lastName"
                      placeholder="e.g. Kumar"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="e.g. scholar@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Mobile Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Date of Birth</Form.Label>
                    <Form.Control
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Gender</Form.Label>
                    <Form.Select name="gender" value={formData.gender} onChange={handleChange} required>
                      <option value="">-- Select Gender --</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Domicile State</Form.Label>
                    <Form.Control
                      type="text"
                      name="state"
                      placeholder="e.g. Jharkhand / Odisha / MP"
                      value={formData.state}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">District</Form.Label>
                    <Form.Control
                      type="text"
                      name="district"
                      placeholder="e.g. Ranchi / Mayurbhanj"
                      value={formData.district}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>

                {/* Academic & Financial */}
                <Col md={12} className="mt-4">
                  <h6 className="fw-bold text-primary border-bottom pb-1 mb-2">2. Academic & Verification Baseline</h6>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Qualifying Degree Level</Form.Label>
                    <Form.Select name="educationLevel" value={formData.educationLevel} onChange={handleChange} required>
                      <option value="">-- Select Qualifying Level --</option>
                      <option value="12th">12th Standard / Higher Secondary</option>
                      <option value="bachelors">Bachelor's (Graduation)</option>
                      <option value="masters">Master's (Post-Graduation)</option>
                      <option value="phd">Ph.D. Enrolled</option>
                      <option value="postdoc">Post-Doctoral</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Degree / Course Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="course"
                      placeholder="e.g. M.Sc. Biotechnology / B.Tech"
                      value={formData.course}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Aggregate Percentage (%)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      name="marksPercent"
                      placeholder="e.g. 74.5"
                      value={formData.marksPercent}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">University / College</Form.Label>
                    <Form.Control
                      type="text"
                      name="university"
                      placeholder="e.g. Central University of Jharkhand"
                      value={formData.university}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Annual Family Income (INR)</Form.Label>
                    <Form.Control
                      type="number"
                      name="familyIncome"
                      placeholder="e.g. 250000"
                      value={formData.familyIncome}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Aadhaar (Last 4 Digits Only)</Form.Label>
                    <Form.Control
                      type="text"
                      maxLength={4}
                      name="aadhaarLast4"
                      placeholder="e.g. 4892"
                      value={formData.aadhaarLast4}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Bank Account Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="bankAccount"
                      placeholder="e.g. 39847192841"
                      value={formData.bankAccount}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Bank IFSC Code</Form.Label>
                    <Form.Control
                      type="text"
                      name="ifsc"
                      placeholder="e.g. SBIN0001234"
                      value={formData.ifsc}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-bold">Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Enter a secure password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="mt-4">
                <Button
                  type="submit"
                  variant="gov-primary"
                  className="w-100 fw-bold py-2 shadow-sm"
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" animation="border" /> : 'Register & Receive OTP'}
                </Button>
              </div>
            </Form>

            <div className="text-center mt-3 small text-muted">
              Already registered? <Link to="/login" className="fw-bold text-primary">Sign In Here</Link>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
