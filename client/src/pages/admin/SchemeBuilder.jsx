import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import { Layers, Plus, Save, CheckCircle2 } from 'lucide-react';

const SchemeBuilder = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    level: 'masters',
    category: 'National Research Fellowship',
    totalSeats: 100,
    stipendAmountPerYear: 384000,
    openDate: new Date().toISOString().split('T')[0],
    closeDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
  });

  const fetchSchemes = async () => {
    try {
      const res = await axiosClient.get('/schemes');
      if (res.data.success) {
        setSchemes(res.data.schemes || []);
      }
    } catch (e) {
      console.error('Failed to load schemes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateScheme = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        ...formData,
        totalSeats: Number(formData.totalSeats),
        stipendAmountPerYear: Number(formData.stipendAmountPerYear),
        formFields: [
          { key: 'marksPercent', label: 'Marks Percentage', type: 'number', required: true },
          { key: 'familyIncome', label: 'Annual Income', type: 'number', required: true },
          { key: 'university', label: 'University / Institute', type: 'text', required: true },
          { key: 'course', label: 'Course Name', type: 'text', required: true }
        ],
        requiredDocuments: [
          { key: 'caste_certificate', label: 'ST Certificate', acceptedTypes: ['pdf', 'jpg'], ocrFields: ['certificate_no', 'holder_name'], required: true },
          { key: 'income_certificate', label: 'Income Certificate', acceptedTypes: ['pdf', 'jpg'], maxAgeMonths: 12, ocrFields: ['annual_income'], required: true },
          { key: 'marksheet', label: 'Qualifying Marksheet', acceptedTypes: ['pdf', 'jpg'], ocrFields: ['percentage'], required: true }
        ],
        eligibilityRules: [
          { field: 'category', operator: 'equals', value: 'ST', message: 'Must belong to Scheduled Tribe' },
          { field: 'familyIncome', operator: 'lte', value: 800000, message: 'Income must not exceed Rs 8,00,000' }
        ]
      };

      const res = await axiosClient.post('/schemes', payload);
      if (res.data.success) {
        setSuccessMsg(`Scheme ${formData.code} created successfully!`);
        fetchSchemes();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create scheme.');
    } finally {
      setSaving(false);
    }
  };

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
                <Layers size={24} className="text-primary" />
                <span>MoTA Scheme Builder</span>
              </h4>
              <p className="text-muted small mb-0">
                Design and launch new scholarship or fellowship programmes with custom rules and document requirements.
              </p>
            </div>
          </div>

          {successMsg && <Alert variant="success" className="py-2 small">{successMsg}</Alert>}
          {errorMsg && <Alert variant="danger" className="py-2 small">{errorMsg}</Alert>}

          <Card className="gov-card p-4 border mb-4">
            <h5 className="fw-bold text-dark mb-3">Create New Fellowship Scheme</h5>

            <Form onSubmit={handleCreateScheme}>
              <Row className="gy-3 mb-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Scheme Code (Unique)</Form.Label>
                    <Form.Control type="text" name="code" placeholder="e.g. ST-EMINENCE" value={formData.code} onChange={handleChange} required />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Full Scheme Name</Form.Label>
                    <Form.Control type="text" name="name" placeholder="e.g. National Eminence Fellowship for ST" value={formData.name} onChange={handleChange} required />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Target Level</Form.Label>
                    <Form.Select name="level" value={formData.level} onChange={handleChange}>
                      <option value="masters">Master's</option>
                      <option value="phd">Ph.D. / Research</option>
                      <option value="undergraduate">Undergraduate</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Scheme Description</Form.Label>
                    <Form.Control as="textarea" rows={2} name="description" value={formData.description} onChange={handleChange} required />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Total Annual Seats</Form.Label>
                    <Form.Control type="number" name="totalSeats" value={formData.totalSeats} onChange={handleChange} required />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Annual Financial Grant (INR)</Form.Label>
                    <Form.Control type="number" name="stipendAmountPerYear" value={formData.stipendAmountPerYear} onChange={handleChange} required />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Opening Date</Form.Label>
                    <Form.Control type="date" name="openDate" value={formData.openDate} onChange={handleChange} required />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Closing Date</Form.Label>
                    <Form.Control type="date" name="closeDate" value={formData.closeDate} onChange={handleChange} required />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end">
                <Button type="submit" variant="gov-primary" className="fw-bold px-4" disabled={saving}>
                  {saving ? <Spinner size="sm" animation="border" /> : <><Plus size={16} className="me-1" /> Create Scheme</>}
                </Button>
              </div>
            </Form>
          </Card>

          {/* Existing Schemes List */}
          <Card className="gov-card p-3 border">
            <h5 className="fw-bold text-dark mb-3">Active Registered Schemes ({schemes.length})</h5>

            <div className="table-responsive">
              <Table size="sm" bordered hover className="gov-table small align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Level</th>
                    <th>Seats</th>
                    <th>Annual Grant</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schemes.map(s => (
                    <tr key={s._id}>
                      <td className="fw-bold text-primary">{s.code}</td>
                      <td>{s.name}</td>
                      <td className="text-capitalize">{s.level}</td>
                      <td>{s.totalSeats}</td>
                      <td className="text-success fw-semibold">₹{(s.stipendAmountPerYear || 0).toLocaleString('en-IN')}</td>
                      <td><Badge bg={s.isActive ? 'success' : 'secondary'}>{s.isActive ? 'Active' : 'Inactive'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SchemeBuilder;
