import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Award, Globe, Moon, Sun } from 'lucide-react';

const GovHeader = () => {
  const { lang, setLang } = useLanguage();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="gov-header-wrapper">
      {/* Tricolour Accent Line at Very Top */}
      <div className="gov-tricolour-strip"></div>

      {/* Main Government Portal Header with 10px Increased Padding */}
      <div className="gov-top-header border-bottom" style={{ paddingTop: '10px', paddingBottom: '20px' }}>
        <Container className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          {/* Brand Logo & Titles */}
          <Link to="/" className="d-flex align-items-center gap-3 text-decoration-none">
            {/* Navy Emblem Icon Box with Golden Ribbon */}
            <div
              className="gov-emblem-box rounded-3 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
              style={{ width: '50px', height: '50px', backgroundColor: '#0B2545' }}
            >
              <Award size={28} className="text-warning" strokeWidth={2.2} />
            </div>

            {/* Title Hierarchy */}
            <div className="d-flex flex-column">
              {/* Row 1: Government of India Pill & SIH ID */}
              <div className="d-flex align-items-center gap-2 mb-1">
                <span
                  className="gov-pill-badge"
                  style={{
                    backgroundColor: '#fffbeb',
                    color: '#d97706',
                    border: '1px solid #fde68a',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '50rem',
                    letterSpacing: '0.4px',
                    lineHeight: '1.2'
                  }}
                >
                  GOVERNMENT OF INDIA
                </span>
                <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                  SIH-26239
                </span>
              </div>

              {/* Row 2: Hindi & English Ministry Title */}
              <div
                className="gov-title-text fw-bold text-dark"
                style={{ fontSize: '1.25rem', letterSpacing: '-0.2px', lineHeight: '1.25' }}
              >
                <span className="text-navy">जनजातीय कार्य मंत्रालय</span>{' '}
                <span className="text-muted fw-normal" style={{ opacity: 0.7 }}>|</span>{' '}
                <span className="text-navy">Ministry of Tribal Affairs</span>
              </div>

              {/* Row 3: Subtitle */}
              <div className="gov-subtitle-text text-muted" style={{ fontSize: '1rem', lineHeight: '1.2' }}>
                National Fellowship &amp; Scholarship Management System for Scheduled Tribes (ST)
              </div>
            </div>
          </Link>

          {/* Right Action Bar (Language Switcher & Theme Switcher) */}
          <div className="d-flex align-items-center gap-3">
            {/* Language Switcher */}
            <div className="d-flex align-items-center gap-1.5 bg-light border px-2.5 py-1.5 rounded-2 gap-1">
              <Globe size={15} className="text-primary" />
              <button
                className={`btn btn-sm py-0 px-1 border-0 ${lang === 'en' ? 'fw-bold text-primary text-decoration-underline' : 'text-muted'}`}
                onClick={() => setLang('en')}
                style={{ fontSize: '1.2rem' }}
              >
                English
              </button>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>|</span>
              <button
                className={`btn btn-sm py-0 px-1 border-0 ${lang === 'hi' ? 'fw-bold text-primary text-decoration-underline' : 'text-muted'}`}
                onClick={() => setLang('hi')}
                style={{ fontSize: '1.2rem' }}
              >
                हिन्दी
              </button>
            </div>

            {/* Theme Toggle (Dark / Light) */}
            <button
              onClick={toggleTheme}
              className="btn btn-sm btn-light border py-1.5 px-2.5 rounded-2 d-flex align-items-center gap-1.5"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              style={{ fontSize: '1.2rem' }}
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={15} className="text-warning" />
                  <span className="small">Light</span>
                </>
              ) : (
                <>
                  <Moon size={15} className="text-secondary" />
                  <span className="small">Dark</span>
                </>
              )}
            </button>
          </div>
        </Container>
      </div>
    </header>
  );
};

export default GovHeader;
