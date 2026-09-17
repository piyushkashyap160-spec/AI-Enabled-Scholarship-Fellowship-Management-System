import React from 'react';
import { Card } from 'react-bootstrap';

const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle = null, trend = null }) => {
  return (
    <Card className="gov-card border-0 shadow-sm h-100">
      <Card.Body className="p-3">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <div className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.5px' }}>
              {title}
            </div>
            <div className="fs-3 fw-bold text-dark mt-1">
              {value}
            </div>
            {subtitle && (
              <div className="small text-secondary mt-0.5">
                {subtitle}
              </div>
            )}
            {trend && (
              <div className="small text-success fw-semibold mt-1">
                {trend}
              </div>
            )}
          </div>
          {Icon && (
            <div
              className={`rounded-3 p-3 d-flex align-items-center justify-content-center bg-${color} bg-opacity-10 text-${color}`}
              style={{ width: '54px', height: '54px' }}
            >
              <Icon size={26} />
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default StatCard;
