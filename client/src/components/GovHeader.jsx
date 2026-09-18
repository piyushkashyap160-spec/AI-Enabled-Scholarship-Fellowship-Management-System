import React, { useState, useEffect } from 'react';
import { Container, ButtonGroup, Button } from 'react-bootstrap';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Moon, Sun } from 'lucide-react';

const GovHeader = () => {
  const { lang, setLang, t } = useLanguage();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="gov-header-wrapper">
      {/* Top Utility Bar */}
      <div className="gov-header-bg py-2 border-bottom border-secondary border-opacity-25">
        <Container className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            {/* National Emblem SVG */}
            <svg width="34" height="42" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <path d="M50 5 L60 25 L85 25 L65 40 L73 65 L50 50 L27 65 L35 40 L15 25 L40 25 Z" fill="#FF9933"/>
              <circle cx="50" cy="85" r="22" stroke="#FFFFFF" strokeWidth="4" fill="#000080"/>
              <circle cx="50" cy="85" r="4" fill="#FFFFFF"/>
              <path d="M50 63 L50 107 M28 85 L72 85 M34 69 L66 101 M34 101 L66 69" stroke="#FFFFFF" strokeWidth="2"/>
            </svg>
            <div>
              <div className="fw-bold text-white fs-6" style={{ letterSpacing: '0.3px' }}>
                {lang === 'hi' ? 'जनजातीय कार्य मंत्रालय, भारत सरकार' : 'Ministry of Tribal Affairs, Government of India'}
              </div>
              <div className="text-white-50 small" style={{ fontSize: '0.78rem' }}>
                {lang === 'hi' ? 'स्मार्ट इंडिया हैकाथॉन पीएस 26239 | राष्ट्रीय छात्रवृत्ति एवं फैलोशिप पोर्टल' : 'Smart India Hackathon PS 26239 | National Scholarship & Fellowship Portal'}
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="btn btn-sm d-flex align-items-center gap-1.5 bg-white bg-opacity-10 text-white border-0 py-1 px-2.5 rounded"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              style={{ fontSize: '0.82rem' }}
            >
              {theme === 'dark' ? <Sun size={15} className="text-warning" /> : <Moon size={15} className="text-info" />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            {/* Language Switcher */}
            <div className="d-flex align-items-center gap-1 bg-white bg-opacity-10 px-2 py-1 rounded">
              <Globe size={15} className="text-warning" />
              <button
                className={`btn btn-sm py-0 px-1 border-0 text-white ${lang === 'en' ? 'fw-bold text-warning text-decoration-underline' : 'opacity-75'}`}
                onClick={() => setLang('en')}
                style={{ fontSize: '0.82rem' }}
              >
                English
              </button>
              <span className="text-white-50">|</span>
              <button
                className={`btn btn-sm py-0 px-1 border-0 text-white ${lang === 'hi' ? 'fw-bold text-warning text-decoration-underline' : 'opacity-75'}`}
                onClick={() => setLang('hi')}
                style={{ fontSize: '0.82rem' }}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </Container>
      </div>

      {/* Tricolour Accent Line */}
      <div className="gov-tricolour-strip"></div>
    </header>
  );
};

export default GovHeader;
