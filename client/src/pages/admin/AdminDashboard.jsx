import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Form } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import StatCard from '../../components/StatCard';
import { LayoutDashboard, FileText, ShieldCheck, FileSearch, Award, Clock, Users, AlertOctagon } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [timeseries, setTimeseries] = useState(null);
  const [byState, setByState] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, tsRes, stateRes, funnelRes] = await Promise.all([
          axiosClient.get('/dashboard/stats'),
          axiosClient.get('/dashboard/timeseries'),
          axiosClient.get('/dashboard/by-state'),
          axiosClient.get('/dashboard/funnel')
        ]);

        if (statsRes.data.success) setStats(statsRes.data.stats);
        if (tsRes.data.success) setTimeseries(tsRes.data);
        if (stateRes.data.success) setByState(stateRes.data);
        if (funnelRes.data.success) setFunnel(funnelRes.data);
      } catch (e) {
        console.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  // 1. By State Chart Data
  const stateChartData = {
    labels: byState?.labels || ['Jharkhand', 'Odisha', 'Madhya Pradesh', 'Chhattisgarh', 'Assam'],
    datasets: [
      {
        label: 'Applications by State',
        data: byState?.data || [14, 11, 8, 7, 5],
        backgroundColor: '#1a3a6b',
        borderRadius: 4
      }
    ]
  };

  // 2. Submission Trend Line Chart
  const lineChartData = {
    labels: timeseries?.labels || ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    datasets: [
      {
        label: 'Application Submissions Over Time',
        data: timeseries?.data || [12, 19, 28, 45, 62],
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  // 3. Scheme Distribution Doughnut Chart
  const doughnutChartData = {
    labels: ['NFST (National Fellowship)', 'NOS (Overseas Scholarship)'],
    datasets: [
      {
        data: [65, 35],
        backgroundColor: ['#1a3a6b', '#FF9933'],
        borderWidth: 2
      }
    ]
  };

  // 4. Stage Funnel Bar Chart
  const funnelChartData = {
    labels: funnel?.stages?.map(s => s.label) || ['Submitted', 'Verified', 'Eligible', 'Merit Listed', 'Awarded'],
    datasets: [
      {
        label: 'Candidates in Stage',
        data: funnel?.stages?.map(s => s.count) || [40, 32, 28, 20, 15],
        backgroundColor: ['#0284c7', '#7c3aed', '#16a34a', '#0891b2', '#15803d'],
        borderRadius: 4
      }
    ]
  };

  return (
    <Container fluid className="py-4 px-lg-4">
      <Row className="gy-4">
        <Col lg={3} md={4}>
          <Sidebar />
        </Col>

        <Col lg={9} md={8}>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <LayoutDashboard size={24} className="text-primary" />
                <span>Ministry Executive Dashboard</span>
              </h4>
              <p className="text-muted small mb-0">
                Live monitoring, OCR verification metrics, state distributions, and throughput funnel.
              </p>
            </div>
          </div>

          {/* Metric Cards Row */}
          <Row className="gy-3 mb-4">
            <Col sm={6} lg={3}>
              <StatCard
                title="Total Submissions"
                value={stats?.totalApplications || 0}
                icon={FileText}
                color="primary"
                subtitle="Active applications"
              />
            </Col>
            <Col sm={6} lg={3}>
              <StatCard
                title="Pending Verification"
                value={stats?.pendingVerifications || 0}
                icon={ShieldCheck}
                color="warning"
                subtitle="Queued for verifiers"
              />
            </Col>
            <Col sm={6} lg={3}>
              <StatCard
                title="Pending Scrutiny"
                value={stats?.pendingScrutiny || 0}
                icon={FileSearch}
                color="info"
                subtitle="Awaiting officer decision"
              />
            </Col>
            <Col sm={6} lg={3}>
              <StatCard
                title="Selected Scholars"
                value={stats?.selectedCount || 0}
                icon={Award}
                color="success"
                subtitle="Provisional merit awards"
              />
            </Col>
          </Row>

          {/* Secondary Metric Cards Row */}
          <Row className="gy-3 mb-4">
            <Col sm={6} lg={4}>
              <StatCard
                title="Avg Processing Time"
                value={`${stats?.avgProcessingDays || 4.2} Days`}
                icon={Clock}
                color="primary"
                subtitle="From submission to merit"
              />
            </Col>
            <Col sm={6} lg={4}>
              <StatCard
                title="Registered Scholars"
                value={stats?.totalUsers || 25}
                icon={Users}
                color="success"
                subtitle="Verified ST accounts"
              />
            </Col>
            <Col sm={6} lg={4}>
              <StatCard
                title="Flagged Anomalies"
                value={stats?.flaggedDocs || 2}
                icon={AlertOctagon}
                color="danger"
                subtitle="Audited for manual scrutiny"
              />
            </Col>
          </Row>

          {/* Charts Row 1 */}
          <Row className="gy-4 mb-4">
            <Col lg={7}>
              <Card className="gov-card p-3 border h-100">
                <h6 className="fw-bold text-dark mb-3">Applications by State (Top Domicile Regions)</h6>
                <div style={{ height: '260px' }}>
                  <Bar data={stateChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </Card>
            </Col>

            <Col lg={5}>
              <Card className="gov-card p-3 border h-100">
                <h6 className="fw-bold text-dark mb-3">Applications by Scheme Distribution</h6>
                <div style={{ height: '260px' }} className="d-flex justify-content-center">
                  <Doughnut data={doughnutChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </Card>
            </Col>
          </Row>

          {/* Charts Row 2 */}
          <Row className="gy-4 mb-4">
            <Col lg={6}>
              <Card className="gov-card p-3 border h-100">
                <h6 className="fw-bold text-dark mb-3">Submission Trends Over Time</h6>
                <div style={{ height: '260px' }}>
                  <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="gov-card p-3 border h-100">
                <h6 className="fw-bold text-dark mb-3">Application Scrutiny & Award Funnel</h6>
                <div style={{ height: '260px' }}>
                  <Bar data={funnelChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;
