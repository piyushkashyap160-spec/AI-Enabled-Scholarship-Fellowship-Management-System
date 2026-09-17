import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  Sparkles,
  FilePlus,
  FileText,
  AlertTriangle,
  Award,
  User,
  ShieldCheck,
  FileSearch,
  ListFilter,
  Layers,
  Sliders,
  Users,
  BarChart3,
  History,
  AlertOctagon
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  const role = user.role;

  return (
    <aside className="gov-card p-3 mb-4 h-100">
      <div className="text-muted small fw-bold text-uppercase px-3 mb-2" style={{ letterSpacing: '0.6px' }}>
        {role === 'admin' ? 'Ministry Admin' : (role === 'officer' ? 'Scrutiny Officer' : (role === 'verifier' ? 'Document Verifier' : 'Applicant Portal'))}
      </div>

      <nav className="d-flex flex-column gap-1">
        {/* Applicant Links */}
        {role === 'applicant' && (
          <>
            <NavLink to="/applicant/dashboard" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>{t('nav.dashboard', 'Dashboard')}</span>
            </NavLink>
            <NavLink to="/applicant/recommendations" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <Sparkles size={18} className="text-warning" />
              <span>{t('nav.schemes', 'Recommended Schemes')}</span>
            </NavLink>
            <NavLink to="/applicant/applications/new" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <FilePlus size={18} />
              <span>New Application</span>
            </NavLink>
            <NavLink to="/applicant/applications" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <FileText size={18} />
              <span>{t('nav.applications', 'My Applications')}</span>
            </NavLink>
            <NavLink to="/applicant/deficiencies" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <AlertTriangle size={18} className="text-warning" />
              <span>{t('nav.deficiencies', 'Deficiency Inbox')}</span>
            </NavLink>
            <NavLink to="/applicant/fellowship" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <Award size={18} className="text-success" />
              <span>{t('nav.fellowship', 'My Fellowship')}</span>
            </NavLink>
            <NavLink to="/applicant/profile" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <User size={18} />
              <span>{t('nav.profile', 'Profile Settings')}</span>
            </NavLink>
          </>
        )}

        {/* Verifier Links */}
        {role === 'verifier' && (
          <>
            <NavLink to="/verifier/queue" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={18} />
              <span>{t('nav.verifier_queue', 'Verification Queue')}</span>
            </NavLink>
            <NavLink to="/verifier/flagged" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <AlertTriangle size={18} className="text-danger" />
              <span>Flagged Documents</span>
            </NavLink>
          </>
        )}

        {/* Officer Links */}
        {role === 'officer' && (
          <>
            <NavLink to="/officer/scrutiny" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <FileSearch size={18} />
              <span>{t('nav.officer_scrutiny', 'Officer Scrutiny')}</span>
            </NavLink>
            <NavLink to="/officer/merit" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <ListFilter size={18} />
              <span>{t('nav.merit_list', 'Merit Ranking')}</span>
            </NavLink>
            <NavLink to="/officer/workflow" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <Layers size={18} />
              <span>Selection Workflow</span>
            </NavLink>
          </>
        )}

        {/* Admin Links */}
        {role === 'admin' && (
          <>
            <NavLink to="/admin/dashboard" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Live Dashboards</span>
            </NavLink>
            <NavLink to="/admin/rules" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <Sliders size={18} className="text-primary" />
              <span>{t('nav.admin_rules', 'Rule Builder (Live Demo)')}</span>
            </NavLink>
            <NavLink to="/admin/schemes" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <Layers size={18} />
              <span>{t('nav.admin_schemes', 'Scheme Builder')}</span>
            </NavLink>
            <NavLink to="/admin/merit" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <Award size={18} />
              <span>Publish Merit List</span>
            </NavLink>
            <NavLink to="/admin/anomalies" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <AlertOctagon size={18} className="text-danger" />
              <span>{t('nav.admin_anomalies', 'Anomaly Dashboard')}</span>
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>{t('nav.admin_users', 'User Management')}</span>
            </NavLink>
            <NavLink to="/admin/reports" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <BarChart3 size={18} />
              <span>Reports & Analytics</span>
            </NavLink>
            <NavLink to="/admin/audit" className={({ isActive }) => `gov-sidebar-item ${isActive ? 'active' : ''}`}>
              <History size={18} />
              <span>{t('nav.admin_audit', 'Official Audit Log')}</span>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
