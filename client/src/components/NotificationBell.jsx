import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, ExternalLink } from 'lucide-react';
import { Overlay, Popover, Badge, Button, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [show, setShow] = useState(false);
  const target = useRef(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await axiosClient.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const markAllRead = async () => {
    try {
      await axiosClient.put('/notifications/all/read');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const markOneRead = async (id) => {
    try {
      await axiosClient.put(`/notifications/${id}/read`);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {}
  };

  if (!isAuthenticated) return null;

  return (
    <div className="position-relative">
      <button
        ref={target}
        onClick={() => setShow(!show)}
        className="btn btn-link text-white position-relative p-2 text-decoration-none"
        title="Notifications"
        style={{ outline: 'none' }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <Badge
            bg="danger"
            pill
            className="position-absolute top-0 start-100 translate-middle border border-light"
            style={{ fontSize: '0.68rem', padding: '0.25em 0.5em' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </button>

      <Overlay
        show={show}
        target={target.current}
        placement="bottom-end"
        rootClose
        onHide={() => setShow(false)}
      >
        <Popover id="popover-notifications" style={{ width: '340px', maxWidth: '90vw', zIndex: 1060 }}>
          <Popover.Header className="d-flex justify-content-between align-items-center py-2 bg-light">
            <span className="fw-bold text-dark fs-6">Notifications</span>
            {unreadCount > 0 && (
              <button
                className="btn btn-sm btn-link text-primary p-0 text-decoration-none"
                style={{ fontSize: '0.78rem' }}
                onClick={markAllRead}
              >
                Mark all read
              </button>
            )}
          </Popover.Header>
          <Popover.Body className="p-0" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div className="text-center py-4 text-muted small">No notifications yet</div>
            ) : (
              <ListGroup variant="flush">
                {notifications.slice(0, 8).map((notif) => (
                  <ListGroup.Item
                    key={notif._id}
                    className={`p-2.5 border-bottom ${!notif.read ? 'bg-primary bg-opacity-10' : ''}`}
                    style={{ cursor: 'pointer', fontSize: '0.84rem' }}
                    onClick={() => {
                      if (!notif.read) markOneRead(notif._id);
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <strong className={`text-truncate ${!notif.read ? 'text-primary' : 'text-dark'}`} style={{ maxWidth: '240px' }}>
                        {notif.subject}
                      </strong>
                      <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {new Date(notif.sentAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-secondary small mt-1 text-truncate-2">
                      {notif.body}
                    </div>
                    {notif.link && (
                      <Link
                        to={notif.link}
                        onClick={() => setShow(false)}
                        className="small text-decoration-none text-primary d-inline-flex align-items-center gap-1 mt-1 fw-semibold"
                      >
                        View Details <ExternalLink size={12} />
                      </Link>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Popover.Body>
        </Popover>
      </Overlay>
    </div>
  );
};

export default NotificationBell;
