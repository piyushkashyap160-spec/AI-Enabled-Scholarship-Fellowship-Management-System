import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Common Components
import GovHeader from './components/GovHeader';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/public/Home';
import SchemeList from './pages/public/SchemeList';
import SchemeDetail from './pages/public/SchemeDetail';
import EligibilityChecker from './pages/public/EligibilityChecker';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import VerifyOtp from './pages/public/VerifyOtp';

// Applicant Pages
import ApplicantDashboard from './pages/applicant/ApplicantDashboard';
import RecommendedSchemes from './pages/applicant/RecommendedSchemes';
import NewApplication from './pages/applicant/NewApplication';
import MyApplications from './pages/applicant/MyApplications';
import ApplicationDetail from './pages/applicant/ApplicationDetail';
import DeficiencyInbox from './pages/applicant/DeficiencyInbox';
import Notifications from './pages/applicant/Notifications';
import Profile from './pages/applicant/Profile';
import MyFellowship from './pages/applicant/MyFellowship';

// Verifier Pages
import VerifierQueue from './pages/verifier/VerifierQueue';
import ReviewApplication from './pages/verifier/ReviewApplication';
import FlaggedDocuments from './pages/verifier/FlaggedDocuments';

// Officer Pages
import OfficerScrutiny from './pages/officer/OfficerScrutiny';
import MeritList from './pages/officer/MeritList';
import SelectionWorkflow from './pages/officer/SelectionWorkflow';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import RuleBuilder from './pages/admin/RuleBuilder';
import SchemeBuilder from './pages/admin/SchemeBuilder';
import Anomalies from './pages/admin/Anomalies';
import UserManagement from './pages/admin/UserManagement';
import AuditLog from './pages/admin/AuditLog';
import Reports from './pages/admin/Reports';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="d-flex flex-column min-vh-100">
            <GovHeader />
            <Navbar />

            <main className="flex-grow-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/schemes" element={<SchemeList />} />
                <Route path="/schemes/:id" element={<SchemeDetail />} />
                <Route path="/eligibility" element={<EligibilityChecker />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />

                {/* Applicant Routes */}
                <Route
                  path="/applicant/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['applicant', 'admin']}>
                      <ApplicantDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applicant/recommendations"
                  element={
                    <ProtectedRoute allowedRoles={['applicant', 'admin']}>
                      <RecommendedSchemes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applicant/applications/new"
                  element={
                    <ProtectedRoute allowedRoles={['applicant', 'admin']}>
                      <NewApplication />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applicant/applications"
                  element={
                    <ProtectedRoute allowedRoles={['applicant', 'admin']}>
                      <MyApplications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applicant/applications/:id"
                  element={
                    <ProtectedRoute allowedRoles={['applicant', 'verifier', 'officer', 'admin']}>
                      <ApplicationDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applicant/deficiencies"
                  element={
                    <ProtectedRoute allowedRoles={['applicant', 'admin']}>
                      <DeficiencyInbox />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applicant/notifications"
                  element={
                    <ProtectedRoute allowedRoles={['applicant', 'verifier', 'officer', 'admin']}>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applicant/profile"
                  element={
                    <ProtectedRoute allowedRoles={['applicant', 'admin']}>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applicant/fellowship"
                  element={
                    <ProtectedRoute allowedRoles={['applicant', 'admin']}>
                      <MyFellowship />
                    </ProtectedRoute>
                  }
                />

                {/* Verifier Routes */}
                <Route
                  path="/verifier/queue"
                  element={
                    <ProtectedRoute allowedRoles={['verifier', 'officer', 'admin']}>
                      <VerifierQueue />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/verifier/review/:id"
                  element={
                    <ProtectedRoute allowedRoles={['verifier', 'officer', 'admin']}>
                      <ReviewApplication />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/verifier/flagged"
                  element={
                    <ProtectedRoute allowedRoles={['verifier', 'officer', 'admin']}>
                      <FlaggedDocuments />
                    </ProtectedRoute>
                  }
                />

                {/* Officer Routes */}
                <Route
                  path="/officer/scrutiny"
                  element={
                    <ProtectedRoute allowedRoles={['officer', 'admin']}>
                      <OfficerScrutiny />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/officer/merit"
                  element={
                    <ProtectedRoute allowedRoles={['officer', 'admin']}>
                      <MeritList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/officer/workflow"
                  element={
                    <ProtectedRoute allowedRoles={['officer', 'admin']}>
                      <SelectionWorkflow />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/rules"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <RuleBuilder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/schemes"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <SchemeBuilder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/merit"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <MeritList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/anomalies"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Anomalies />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/audit"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AuditLog />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Reports />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <ChatWidget />
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
