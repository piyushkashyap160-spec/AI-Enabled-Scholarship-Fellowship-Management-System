import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import { Bell, CheckCheck, ExternalLink, Mail, MessageSquare } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await axiosClient.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (e) {
      console.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAllAsRead = async () => {
    try {
      await axiosClient.put('/notifications/all/read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const markSingleAsRead = async (id) => {
    try {
      await axiosClient.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {}
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
                <Bell size={24} className="text-primary" />
                <span>My Notifications & Ministry Communications</span>
              </h4>
              <p className="text-muted small mb-0">
                Official alerts, OCR verification summaries, and reminder communications.
              </p>
            </div>

            <Button
              variant="outline-primary"
              size="sm"
              onClick={markAllAsRead}
              className="d-flex align-items-center gap-1.5"
            >
              <CheckCheck size={16} /> Mark All as Read
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : notifications.length === 0 ? (
            <Card className="gov-card p-5 text-center text-muted">
              <Bell size={40} className="mx-auto mb-2 opacity-50" />
              <div className="fw-bold">No notifications found</div>
            </Card>
          ) : (
            <Card className="gov-card border">
              <ListGroup variant="flush">
                {notifications.map((notif) => (
                  <ListGroup.Item
                    key={notif._id}
                    className={`p-3 border-bottom ${!notif.read ? 'bg-primary bg-opacity-10' : ''}`}
                    style={{ transition: 'background-color 0.2s ease' }}
                  >
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <strong className="text-dark fs-6">{notif.subject}</strong>
                        {!notif.read && <Badge bg="primary">New</Badge>}
                        <span className="badge bg-secondary" style={{ fontSize: '0.68rem' }}>{notif.type}</span>
                      </div>
                      <span className="text-muted small">
                        {new Date(notif.sentAt).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <p className="text-secondary small mb-2" style={{ lineHeight: '1.5' }}>
                      {notif.body}
                    </p>

                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        {notif.link && (
                          <Link to={notif.link} className="btn btn-outline-primary btn-sm py-0.5 px-2 text-decoration-none small d-inline-flex align-items-center gap-1">
                            Go to Details <ExternalLink size={12} />
                          </Link>
                        )}
                      </div>

                      {!notif.read && (
                        <button
                          className="btn btn-sm btn-link text-muted p-0 text-decoration-none small"
                          onClick={() => markSingleAsRead(notif._id)}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Notifications;
