import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLanguage } from '../context/LanguageContext';
import { Award, ShieldCheck, ExternalLink } from 'lucide-react';

const Footer = () => {
  const { t, lang } = useLanguage();

  return (
    <footer className="mt-auto bg-dark text-white border-top border-secondary border-opacity-25 pt-4 pb-3">
      <Container>
        <Row className="gy-4">
          <Col lg={5} md={6}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <Award className="text-warning" size={24} />
              <h5 className="text-white mb-0 fs-6 fw-bold">
                {lang === 'hi' ? 'जनजातीय कार्य मंत्रालय' : 'Ministry of Tribal Affairs'}
              </h5>
            </div>
            <p className="text-white-50 small mb-2" style={{ lineHeight: '1.6' }}>
              {t('footer.disclaimer', 'This is an official digital initiative for Smart India Hackathon PS 26239, developed for the Ministry of Tribal Affairs (MoTA), Government of India.')}
            </p>
            <div className="d-flex align-items-center gap-2 text-warning small fw-semibold">
              <ShieldCheck size={16} /> 100% Offline AI OCR & Local Rule Evaluation Engine
            </div>
          </Col>

          <Col lg={3} md={6}>
            <h6 className="text-white text-uppercase small fw-bold mb-3" style={{ letterSpacing: '0.5px' }}>
              Key Schemes
            </h6>
            <ul className="list-unstyled small text-white-50 d-flex flex-column gap-1.5">
              <li>• National Fellowship for ST Students (NFST)</li>
              <li>• National Overseas Scholarship (NOS)</li>
              <li>• Direct Benefit Transfer (DBT - PFMS)</li>
              <li>• Pre-Check Automated Rules Engine</li>
            </ul>
          </Col>

          <Col lg={4} md={12}>
            <h6 className="text-white text-uppercase small fw-bold mb-3" style={{ letterSpacing: '0.5px' }}>
              Governance Principles
            </h6>
            <p className="text-white-50 small mb-2">
              <strong>Human-in-the-Loop:</strong> The AI extracts, validates and flags discrepancies. Final scholarship award and rejection decisions are exclusively executed by authorized Government Officers with mandatory audit tracking.
            </p>
          </Col>
        </Row>

        <div className="border-top border-secondary border-opacity-25 mt-4 pt-3 text-center text-white-50 small">
          © {new Date().getFullYear()} Ministry of Tribal Affairs, Government of India. {t('footer.rights', 'All Rights Reserved.')}
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
