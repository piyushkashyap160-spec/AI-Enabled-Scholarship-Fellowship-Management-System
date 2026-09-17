import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import DataTable from '../../components/DataTable';
import { Users, Shield, CheckCircle } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/admin/users?role=${roleFilter}`);
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (e) {
      console.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await axiosClient.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        setSuccessMsg(`User role updated to ${newRole}`);
        fetchUsers();
        setTimeout(() => setSuccessMsg(null), 2500);
      }
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  const columns = [
    {
      label: 'Name',
      accessor: 'name',
      render: (row) => <div><strong className="text-dark">{row.name}</strong><div className="small text-muted">{row.email}</div></div>
    },
    {
      label: 'Phone',
      accessor: 'phone'
    },
    {
      label: 'State / Region',
      accessor: (row) => row.profile?.state || 'Jharkhand',
      render: (row) => row.profile?.state || 'Jharkhand'
    },
    {
      label: 'Current Role',
      accessor: 'role',
      render: (row) => {
        const bg = row.role === 'admin' ? 'primary' : (row.role === 'officer' ? 'warning' : (row.role === 'verifier' ? 'info' : 'success'));
        return <Badge bg={bg} className="text-uppercase">{row.role}</Badge>;
      }
    },
    {
      label: 'Change Role',
      sortable: false,
      render: (row) => (
        <Form.Select
          size="sm"
          value={row.role}
          onChange={(e) => handleRoleChange(row._id, e.target.value)}
          style={{ width: '130px' }}
        >
          <option value="applicant">Applicant</option>
          <option value="verifier">Verifier</option>
          <option value="officer">Officer</option>
          <option value="admin">Admin</option>
        </Form.Select>
      )
    }
  ];

  return (
    <Container fluid className="py-4 px-lg-4">
      <Row className="gy-4">
        <Col lg={3} md={4}>
          <Sidebar />
        </Col>

        <Col lg={9} md={8}>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <Users size={24} className="text-primary" />
                <span>Portal User Management & Role Permissions</span>
              </h4>
              <p className="text-muted small mb-0">
                Manage roles and permissions for Verifiers, Scrutiny Officers, and ST Scholars.
              </p>
            </div>

            <div style={{ width: '180px' }}>
              <Form.Select size="sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="ALL">All Portal Roles</option>
                <option value="applicant">Applicants Only</option>
                <option value="verifier">Verifiers Only</option>
                <option value="officer">Officers Only</option>
                <option value="admin">Admins Only</option>
              </Form.Select>
            </div>
          </div>

          {successMsg && <Alert variant="success" className="py-2 small">{successMsg}</Alert>}

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <DataTable
              columns={columns}
              data={users}
              searchPlaceholder="Search by name, email, phone..."
              exportFilename="mota_portal_users"
            />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default UserManagement;
