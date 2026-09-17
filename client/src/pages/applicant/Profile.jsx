import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import { User, Save, CheckCircle } from 'lucide-react';

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const { setLang } = useLanguage();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    preferredLanguage: user?.preferredLanguage || 'en',
    dob: user?.profile?.dob ? new Date(user.profile.dob).toISOString().split('T')[0] : '',
    gender: user?.profile?.gender || '',
    state: user?.profile?.state || '',
    district: user?.profile?.district || '',
    educationLevel: user?.profile?.education?.level || '',
    course: user?.profile?.education?.course || '',
    university: user?.profile?.education?.university || '',
    marksPercent: user?.profile?.education?.marksPercent ?? '',
    familyIncome: user?.profile?.familyIncome ?? '',
    bankAccount: user?.profile?.bankAccount || '',
    ifsc: user?.profile?.ifsc || '',
    aadhaarLast4: user?.profile?.aadhaarLast4 || ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
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
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await axiosClient.put('/auth/profile', {
        name: formData.name,
        phone: formData.phone,
        preferredLanguage: formData.preferredLanguage,
        profile: {
          dob: formData.dob,
          gender: formData.gender,
          category: 'ST',
          state: formData.state,
          district: formData.district,
          aadhaarLast4: formData.aadhaarLast4,
          familyIncome: Number(formData.familyIncome),
          bankAccount: formData.bankAccount,
          ifsc: formData.ifsc,
          education: {
            level: formData.educationLevel,
            course: formData.course,
            university: formData.university,
            marksPercent: Number(formData.marksPercent),
            yearOfPassing: 2024
          }
        }
      });

      if (res.data.success) {
        updateUserProfile(res.data.user);
        setLang(formData.preferredLanguage);
        setSuccess('Profile updated successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="py-4 px-lg-4">
      <Row className="gy-4">
        <Col lg={3} md={4}>
          <Sidebar />
        </Col>

        <Col lg={9} md={8}>
          <Card className="gov-card p-4 border">
            <div className="d-flex align-items-center gap-2 mb-3 border-bottom pb-2">
              <User size={24} className="text-primary" />
              <h4 className="fw-bold text-dark mb-0">My Scholar Profile & Settings</h4>
            </div>

            {success && <Alert variant="success" className="py-2 small">{success}</Alert>}
            {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <h6 className="fw-bold text-primary mb-3">1. Basic Details</h6>
              <Row className="gy-3 mb-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Full Name</Form.Label>
                    <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Email (Read Only)</Form.Label>
                    <Form.Control type="email" value={user?.email || ''} disabled className="bg-light" />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Phone Number</Form.Label>
                    <Form.Control type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Date of Birth</Form.Label>
                    <Form.Control type="date" name="dob" value={formData.dob} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Preferred Portal Language</Form.Label>
                    <Form.Select name="preferredLanguage" value={formData.preferredLanguage} onChange={handleChange}>
                      <option value="en">English</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <h6 className="fw-bold text-primary mb-3">2. Academic & Direct Benefit Transfer (DBT) Banking</h6>
              <Row className="gy-3 mb-4">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Education Level</Form.Label>
                    <Form.Select name="educationLevel" value={formData.educationLevel} onChange={handleChange}>
                      <option value="">-- Select Degree Level --</option>
                      <option value="12th">12th Standard / Higher Secondary</option>
                      <option value="bachelors">Bachelor's Degree</option>
                      <option value="masters">Master's Degree</option>
                      <option value="phd">Ph.D. / Doctoral</option>
                      <option value="postdoc">Post-Doctoral</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Degree / Course</Form.Label>
                    <Form.Control type="text" name="course" value={formData.course} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Marks Aggregate (%)</Form.Label>
                    <Form.Control type="number" step="0.1" name="marksPercent" value={formData.marksPercent} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">University / Institute</Form.Label>
                    <Form.Control type="text" name="university" value={formData.university} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Annual Family Income (INR)</Form.Label>
                    <Form.Control type="number" name="familyIncome" value={formData.familyIncome} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Aadhaar Last 4 Digits</Form.Label>
                    <Form.Control type="text" maxLength={4} name="aadhaarLast4" value={formData.aadhaarLast4} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Bank Account Number (PFMS DBT)</Form.Label>
                    <Form.Control type="text" name="bankAccount" value={formData.bankAccount} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Bank IFSC Code</Form.Label>
                    <Form.Control type="text" name="ifsc" value={formData.ifsc} onChange={handleChange} required />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end">
                <Button type="submit" variant="gov-primary" className="fw-bold px-4 d-flex align-items-center gap-1.5" disabled={loading}>
                  {loading ? <Spinner size="sm" animation="border" /> : <><Save size={16} /> Save Profile Changes</>}
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
