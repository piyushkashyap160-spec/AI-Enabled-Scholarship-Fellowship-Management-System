import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Award, Globe, Calendar, Users, ArrowRight } from 'lucide-react';

const SchemeList = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('all');

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await axiosClient.get(`/schemes?level=${levelFilter}&active=true`);
        if (res.data.success) {
          setSchemes(res.data.schemes || []);
        }
      } catch (e) {
        console.error('Failed to fetch schemes');
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, [levelFilter]);

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-dark mb-1">Scholarship & Fellowship Schemes</h2>
          <p className="text-muted small mb-0">
            Browse all open Ministry of Tribal Affairs higher education and research schemes.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="small text-muted fw-semibold">Filter by Level:</span>
          <Form.Select
            size="sm"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            style={{ width: '190px' }}
          >
            <option value="all">All Levels (5 Schemes)</option>
            <option value="10th">Class 9th & 10th (Pre-Matric)</option>
            <option value="12th">Class 11th & 12th / Diploma</option>
            <option value="bachelors">Undergraduate / Degree</option>
            <option value="masters">Master's Level</option>
            <option value="phd">Ph.D. / Research</option>
          </Form.Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : schemes.length === 0 ? (
        <div className="text-center py-5 text-muted">No schemes found.</div>
      ) : (
        <Row className="gy-4">
          {schemes.map((scheme) => (
            <Col lg={6} key={scheme._id}>
              <Card className="gov-card h-100 border p-3">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Badge bg="primary" className="px-2.5 py-1 text-uppercase fw-bold">
                      {scheme.code}
                    </Badge>
                    <Badge bg={scheme.isActive ? 'success' : 'secondary'} className="px-2.5 py-1">
                      {scheme.isActive ? 'Active & Open' : 'Closed'}
                    </Badge>
                  </div>

                  <h4 className="fw-bold text-dark mb-2">{scheme.name}</h4>
                  <p className="text-secondary small flex-grow-1" style={{ lineHeight: '1.6' }}>
                    {scheme.description}
                  </p>

                  <div className="bg-light p-3 rounded mb-3 small">
                    <div className="row g-2">
                      <div className="col-6">
                        <span className="text-muted d-block">Target Level:</span>
                        <strong className="text-capitalize text-dark">{scheme.level}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block">Annual Seats:</span>
                        <strong className="text-dark">{scheme.totalSeats} seats</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block">Application Closes:</span>
                        <strong className="text-dark">{new Date(scheme.closeDate).toLocaleDateString('en-IN')}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block">Stipend / Support:</span>
                        <strong className="text-success">₹{(scheme.stipendAmountPerYear || 384000).toLocaleString('en-IN')} / yr</strong>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <Link to={`/eligibility?scheme=${scheme.code}`} className="btn btn-outline-primary btn-sm flex-fill fw-semibold">
                      Pre-Check Eligibility
                    </Link>
                    <Link to={`/schemes/${scheme._id}`} className="btn btn-gov-primary btn-sm flex-fill fw-semibold">
                      Full Details <ArrowRight size={14} />
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default SchemeList;
