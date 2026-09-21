import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Spinner, Alert } from 'react-bootstrap';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import DocumentUploader from '../../components/DocumentUploader';
import DocumentPreviewModal from '../../components/DocumentPreviewModal';
import { AlertTriangle, CheckCircle, UploadCloud, Clock, Calendar, RefreshCw, Eye } from 'lucide-react';

const DeficiencyInbox = () => {
  const [applications, setApplications] = useState([]);
  const [deficiencies, setDeficiencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeficiency, setSelectedDeficiency] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const fetchDeficiencies = async () => {
    try {
      const res = await axiosClient.get('/applications/mine');
      if (res.data.success) {
        const apps = res.data.applications || [];
        setApplications(apps);

        // Fetch detailed deficiencies across all applications
        const defPromises = apps.map(a => axiosClient.get(`/applications/${a._id}`));
        const appDetails = await Promise.all(defPromises);

        let allDefs = [];
        appDetails.forEach(d => {
          if (d.data.success && d.data.deficiencies) {
            const enriched = d.data.deficiencies.map(def => {
              const currentDoc = d.data.documents?.find(doc => 
                (def.documentId && (doc._id === def.documentId || doc._id === def.documentId?._id)) || 
                doc.docKey === def.docKey
              );
              return {
                ...def,
                applicationNo: d.data.application?.applicationNo,
                schemeName: d.data.application?.schemeId?.name,
                applicationId: d.data.application?._id,
                currentDocument: currentDoc
              };
            });
            allDefs = [...allDefs, ...enriched];
          }
        });

        setDeficiencies(allDefs);
      }
    } catch (e) {
      console.error('Failed to load deficiencies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeficiencies();
  }, []);

  const handleOpenReupload = (def) => {
    setSelectedDeficiency(def);
    setShowModal(true);
    setSuccessMsg(null);
  };

  const handleReuploadComplete = () => {
    setSuccessMsg('Replacement certificate uploaded! AI OCR has re-verified your document and updated the deficiency status.');
    setTimeout(() => {
      setShowModal(false);
      fetchDeficiencies();
    }, 2000);
  };

  const openDefs = deficiencies.filter(d => d.status === 'open');
  const resolvedDefs = deficiencies.filter(d => d.status === 'resolved');

  return (
    <Container fluid className="py-4 px-lg-4">
      <Row className="gy-4">
        <Col lg={3} md={4}>
          <Sidebar />
        </Col>

        <Col lg={9} md={8}>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <AlertTriangle className="text-warning" size={24} />
                <span>Deficiency Inbox & Resolution Loop</span>
              </h4>
              <p className="text-muted small mb-0">
                View officer flags, reason notices, and re-upload corrected certificates directly to resume verification.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <>
              {/* OPEN DEFICIENCIES */}
              <Card className="gov-card p-3 mb-4 border">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0 fs-6 fw-bold text-dark d-flex align-items-center gap-2">
                    <span className="badge bg-warning text-dark">{openDefs.length}</span>
                    <span>Action Required (Open Deficiencies)</span>
                  </h5>
                </div>

                {openDefs.length === 0 ? (
                  <div className="text-center py-4 text-muted small bg-light rounded">
                    <CheckCircle className="text-success mb-2" size={32} />
                    <div className="fw-bold text-dark">No open deficiencies!</div>
                    <div>All uploaded documents have satisfied verification checks.</div>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {openDefs.map((def) => {
                      const daysLeft = Math.ceil((new Date(def.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

                      return (
                        <div key={def._id} className="p-3 border rounded bg-warning bg-opacity-10 border-warning">
                          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                            <div>
                              <strong className="text-dark fs-6 text-capitalize">
                                {def.docKey?.replace(/_/g, ' ')}
                              </strong>
                              <span className="text-muted small ms-2">
                                (Application #{def.applicationNo})
                              </span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <Badge bg={daysLeft <= 2 ? 'danger' : 'warning'} text={daysLeft <= 2 ? 'white' : 'dark'}>
                                <Clock size={12} className="me-1" /> Due in {daysLeft} day(s)
                              </Badge>
                            </div>
                          </div>

                          <div className="p-2.5 bg-white rounded border small text-dark mb-3">
                            <strong>Official Flag Reason:</strong> <em>"{def.reason}"</em>
                            <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                              Raised By: <strong>{def.raisedBy}</strong> on {new Date(def.raisedAt).toLocaleDateString('en-IN')} | Due Date: <strong>{new Date(def.dueDate).toLocaleDateString('en-IN')}</strong>
                            </div>
                          </div>

                          <div className="d-flex justify-content-end gap-2">
                            {def.currentDocument && (
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="fw-semibold px-3 d-flex align-items-center gap-1.5"
                                onClick={() => {
                                  setPreviewDoc(def.currentDocument);
                                  setShowPreviewModal(true);
                                }}
                              >
                                <Eye size={16} /> View Existing Document
                              </Button>
                            )}
                            <Button
                              variant="gov-primary"
                              size="sm"
                              className="fw-bold px-3 d-flex align-items-center gap-1.5"
                              onClick={() => handleOpenReupload(def)}
                            >
                              <UploadCloud size={16} /> Re-Upload Corrected File
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* RESOLVED DEFICIENCIES */}
              {resolvedDefs.length > 0 && (
                <Card className="gov-card p-3 border">
                  <h5 className="mb-3 fs-6 fw-bold text-dark d-flex align-items-center gap-2">
                    <CheckCircle size={18} className="text-success" />
                    <span>Previously Resolved Deficiencies ({resolvedDefs.length})</span>
                  </h5>

                  <div className="d-flex flex-column gap-2">
                    {resolvedDefs.map((def) => (
                      <div key={def._id} className="p-2.5 border rounded bg-light d-flex justify-content-between align-items-center small">
                        <div>
                          <strong>{def.docKey?.replace(/_/g, ' ').toUpperCase()}</strong> — Application #{def.applicationNo}
                          <div className="text-muted">{def.reason}</div>
                        </div>
                        <Badge bg="success">Resolved on {new Date(def.resolvedAt || def.updatedAt).toLocaleDateString('en-IN')}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Re-Upload Modal */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
            <Modal.Header closeButton className="bg-light">
              <Modal.Title className="fs-6 fw-bold">
                Re-Upload Document: {selectedDeficiency?.docKey?.replace(/_/g, ' ').toUpperCase()}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              {successMsg ? (
                <Alert variant="success" className="py-3 text-center">
                  <CheckCircle size={32} className="text-success mb-2" />
                  <div className="fw-bold fs-6">{successMsg}</div>
                </Alert>
              ) : (
                <>
                  <div className="alert alert-warning py-2 small mb-3">
                    <strong>Deficiency Notice:</strong> {selectedDeficiency?.reason}
                  </div>

                  <DocumentUploader
                    applicationId={selectedDeficiency?.applicationId}
                    docKey={selectedDeficiency?.docKey}
                    label={`Replacement ${selectedDeficiency?.docKey?.replace(/_/g, ' ')}`}
                    isReupload={true}
                    currentDoc={selectedDeficiency?.currentDocument}
                    deficiencyId={selectedDeficiency?._id}
                    onUploadSuccess={handleReuploadComplete}
                  />
                </>
              )}
            </Modal.Body>
          </Modal>

          {/* Document Preview Modal */}
          <DocumentPreviewModal
            show={showPreviewModal}
            onHide={() => setShowPreviewModal(false)}
            document={previewDoc}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default DeficiencyInbox;
