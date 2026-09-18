import React from 'react';
import { Navbar as BsNavbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import NotificationBell from './NotificationBell';
import { User, LogOut, ShieldCheck, CheckCircle2, FileText, Layers, Award } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'verifier') return '/verifier/queue';
    if (user.role === 'officer') return '/officer/scrutiny';
    return '/applicant/dashboard';
  };

  return (
    <BsNavbar expand="lg" className="gov-header-bg py-2 shadow-sm border-bottom border-secondary border-opacity-25" variant="dark">
      <Container>
        {/* Brand */}
        <BsNavbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2 fw-bold text-white fs-5">
          <Award className="text-warning" size={24} />
          <span>MoTA <span className="text-warning">Fellowships</span></span>
        </BsNavbar.Brand>

        <BsNavbar.Toggle aria-controls="main-navbar-nav" />
        <BsNavbar.Collapse id="main-navbar-nav">
          <Nav className="me-auto align-items-center">
            <Nav.Link as={NavLink} to="/" className="gov-nav-link">
              {t('nav.home', 'Home')}
            </Nav.Link>
            <Nav.Link as={NavLink} to="/schemes" className="gov-nav-link">
              {t('nav.schemes', 'Schemes')}
            </Nav.Link>
            <Nav.Link as={NavLink} to="/eligibility" className="gov-nav-link text-warning fw-semibold">
              {t('nav.eligibility', 'Eligibility Pre-Check')}
            </Nav.Link>
            <Nav.Link as={NavLink} to="/ml-hub" className="gov-nav-link text-info fw-semibold">
              ⚡ ML Hub (AI Models)
            </Nav.Link>

            {/* Quick Link based on logged-in role */}
            {isAuthenticated && (
              <Nav.Link as={NavLink} to={getDashboardPath()} className="gov-nav-link">
                {t('nav.dashboard', 'Workspace')}
              </Nav.Link>
            )}
          </Nav>

          <Nav className="align-items-center gap-2">
            {isAuthenticated ? (
              <>
                <NotificationBell />

                <NavDropdown
                  title={
                    <span className="d-inline-flex align-items-center gap-2 text-white">
                      <div className="rounded-circle bg-warning text-dark fw-bold d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="fw-medium text-truncate" style={{ maxWidth: '140px' }}>
                        {user?.name?.split(' ')[0]}
                      </span>
                      <Badge bg="light" text="dark" className="text-uppercase" style={{ fontSize: '0.65rem' }}>
                        {user?.role}
                      </Badge>
                    </span>
                  }
                  id="user-nav-dropdown"
                  align="end"
                >
                  <NavDropdown.Header>
                    <div className="fw-bold text-dark">{user?.name}</div>
                    <div className="text-muted small">{user?.email}</div>
                  </NavDropdown.Header>
                  <NavDropdown.Divider />
                  
                  {user?.role === 'applicant' && (
                    <>
                      <NavDropdown.Item as={Link} to="/applicant/profile">
                        <User size={15} className="me-2" /> {t('nav.profile', 'My Profile')}
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/applicant/applications">
                        <FileText size={15} className="me-2" /> {t('nav.applications', 'My Applications')}
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/applicant/deficiencies">
                        <CheckCircle2 size={15} className="me-2" /> {t('nav.deficiencies', 'Deficiency Inbox')}
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/applicant/fellowship">
                        <Award size={15} className="me-2" /> {t('nav.fellowship', 'My Fellowship')}
                      </NavDropdown.Item>
                    </>
                  )}

                  {user?.role === 'verifier' && (
                    <NavDropdown.Item as={Link} to="/verifier/queue">
                      <ShieldCheck size={15} className="me-2" /> {t('nav.verifier_queue', 'Verification Queue')}
                    </NavDropdown.Item>
                  )}

                  {user?.role === 'officer' && (
                    <>
                      <NavDropdown.Item as={Link} to="/officer/scrutiny">
                        <Layers size={15} className="me-2" /> {t('nav.officer_scrutiny', 'Officer Scrutiny')}
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/officer/merit">
                        <Award size={15} className="me-2" /> {t('nav.merit_list', 'Merit List')}
                      </NavDropdown.Item>
                    </>
                  )}

                  {user?.role === 'admin' && (
                    <>
                      <NavDropdown.Item as={Link} to="/admin/dashboard">
                        <Layers size={15} className="me-2" /> {t('nav.dashboard', 'Admin Dashboard')}
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/admin/rules">
                        <ShieldCheck size={15} className="me-2" /> {t('nav.admin_rules', 'Rule Builder')}
                      </NavDropdown.Item>
                    </>
                  )}

                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout} className="text-danger fw-semibold">
                    <LogOut size={15} className="me-2" /> {t('nav.logout', 'Sign Out')}
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link to="/login" className="btn btn-outline-light btn-sm px-3 fw-semibold">
                  {t('nav.login', 'Sign In')}
                </Link>
                <Link to="/register" className="btn btn-warning btn-sm px-3 fw-bold text-dark">
                  {t('nav.register', 'Register')}
                </Link>
              </div>
            )}
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
};

export default Navbar;
