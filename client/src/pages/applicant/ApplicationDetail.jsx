import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Table, Modal } from 'react-bootstrap';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import axiosClient from '../../api/axiosClient';
import Sidebar from '../../components/Sidebar';
import Timeline from '../../components/Timeline';
import StatusBadge from '../../components/StatusBadge';
import OcrResultCard from '../../components/OcrResultCard';
import EligibilityResultCard from '../../components/EligibilityResultCard';
import DocumentPreviewModal from '../../components/DocumentPreviewModal';
import DocumentUploader from '../../components/DocumentUploader';
import { FileText, ArrowLeft, Award, ShieldCheck, AlertTriangle, CheckCircle2, History, Eye, UploadCloud } from 'lucide-react';

const ApplicationDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isJustSubmitted = searchParams.get('submitted') === 'true';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Re-upload Modal State
  const [showReuploadModal, setShowReuploadModal] = useState(false);
  const [reuploadTarget, setReuploadTarget] = useState(null);
  const [reuploadSuccessMsg, setReuploadSuccessMsg] = useState(null);

  const handleOpenPreview = (doc) => {
    setPreviewDoc(doc);
    setShowPreviewModal(true);
  };

  const handleOpenReupload = (doc, deficiency) => {
    setReuploadTarget({ doc, deficiency });
    setReuploadSuccessMsg(null);
    setShowReuploadModal(true);
  };

  const fetchApp = useCallback(async () => {
    try {
      const res = await axiosClient.get(`/applications/${id}`);
      if (res.data.success) {
        setData(res.data);

        // Confetti celebration if awarded / selected or just submitted
        if (['SELECTED', 'AWARD_ACCEPTED', 'DISBURSING'].includes(res.data.application?.status) || isJustSubmitted) {
          try {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          } catch {}
        }
      }
    } catch (err) {
      setError('Failed to load application details.');
    } finally {
      setLoading(false);
    }
  }, [id, isJustSubmitted]);

  useEffect(() => {
    fetchApp();
  }, [fetchApp]);

  const handleReuploadComplete = () => {
    setReuploadSuccessMsg('Replacement certificate uploaded! AI OCR has re-verified your document and updated the status.');
    setTimeout(() => {
      setShowReuploadModal(false);
      setReuploadTarget(null);
      setReuploadSuccessMsg(null);
      fetchApp();
    }, 2000);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error || !data?.application) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Application not found.'}</Alert>
      </Container>
    );
  }

  const { application, documents = [], deficiencies = [] } = data;
  const scheme = application.schemeId;
  const openDeficiencies = deficiencies.filter(d => d.status === 'open');

  return (
    <Container fluid className="py-4 px-lg-4">
      <Row className="gy-4">
        <Col lg={3} md={4}>
          <Sidebar />
        </Col>

        <Col lg={9} md={8}>
          {/* Top Navigation */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Link to="/applicant/applications" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1">
              <ArrowLeft size={14} /> Back to My Applications
            </Link>
          </div>

          {/* Submission Success Toast Banner */}
          {isJustSubmitted && (
            <Alert variant="success" className="p-3 mb-4 shadow-sm border-success">
              <div className="d-flex align-items-center gap-2">
                <CheckCircle2 size={24} className="text-success" />
                <div>
                  <strong className="fs-6">Application Submitted Successfully!</strong>
                  <div className="small">Your tracking reference is <strong>{application.applicationNo}</strong>. AI OCR verification and scrutiny have been initialized.</div>
                </div>
              </div>
            </Alert>
          )}

          {/* Open Deficiency Warning Alert */}
          {openDeficiencies.length > 0 && (
            <Alert variant="warning" className="p-3 mb-4 shadow-sm border-warning">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <AlertTriangle size={24} className="text-warning flex-shrink-0" />
                  <div>
                    <strong className="text-dark fs-6">⚠ Action Required: Document Deficiency Notice ({openDeficiencies.length})</strong>
                    <div className="small text-secondary">
                      One or more uploaded documents require attention or have been flagged by the scrutiny officer. Please review and re-upload.
                    </div>
                  </div>
                </div>
                <Link to="/applicant/deficiencies" className="btn btn-outline-dark btn-sm fw-bold">
                  Deficiency Inbox →
                </Link>
              </div>

              <div className="d-flex flex-column gap-2 mt-2">
                {openDeficiencies.map((def) => {
                  const linkedDoc = documents.find(d => (def.documentId && (d._id === def.documentId || d._id === def.documentId?._id)) || d.docKey === def.docKey);
                  return (
                    <div key={def._id} className="p-2.5 bg-white rounded border small d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div>
                        <strong className="text-dark text-capitalize">{def.docKey?.replace(/_/g, ' ')}</strong>: <span className="text-danger fw-semibold">"{def.reason}"</span>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Raised by: <strong>{def.raisedBy}</strong> | Due: <strong>{new Date(def.dueDate).toLocaleDateString('en-IN')}</strong>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        {linkedDoc && (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="d-inline-flex align-items-center gap-1"
                            onClick={() => handleOpenPreview(linkedDoc)}
                          >
                            <Eye size={14} /> View Existing Document
                          </Button>
                        )}
                        <Button
                          variant="warning"
                          size="sm"
                          className="fw-bold text-dark d-inline-flex align-items-center gap-1"
                          onClick={() => handleOpenReupload(linkedDoc, def)}
                        >
                          <UploadCloud size={14} /> Re-upload Document
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Alert>
          )}

          {/* Stage Progress Timeline */}
          <Timeline
            currentStatus={application.status}
            stageHistory={application.stageHistory || []}
          />

          {/* Application Meta Header */}
          <Card className="gov-card p-4 mb-4 border">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
              <div>
                <Badge bg="primary" className="px-2.5 py-1 text-uppercase fw-bold mb-1">
                  {scheme?.code || 'SCHEME'}
                </Badge>
                <h4 className="fw-bold text-dark mb-1">{scheme?.name}</h4>
                <div className="text-muted small">
                  Application No: <strong className="text-primary">{application.applicationNo}</strong> | Submitted: <strong>{application.submittedAt ? new Date(application.submittedAt).toLocaleDateString('en-IN') : 'Draft'}</strong>
                </div>
              </div>
              <div className="text-end">
                <StatusBadge status={application.status} size="lg" />
                {application.meritRank && (
                  <div className="small text-success fw-bold mt-1">
                    Merit Rank: #{application.meritRank} (Score: {application.meritScore}/100)
                  </div>
                )}
              </div>
            </div>

            {/* Application Data Grid */}
            <div className="bg-light p-3 rounded small">
              <Row className="gy-2">
                <Col md={3} xs={6}>
                  <span className="text-muted d-block">Applicant Name:</span>
                  <strong className="text-dark">{application.applicantId?.name}</strong>
                </Col>
                <Col md={3} xs={6}>
                  <span className="text-muted d-block">Category:</span>
                  <strong className="text-dark">{application.formData?.category || 'ST'}</strong>
                </Col>
                <Col md={3} xs={6}>
                  <span className="text-muted d-block">Declared Income:</span>
                  <strong className="text-dark">₹{(application.formData?.familyIncome || 0).toLocaleString('en-IN')}</strong>
                </Col>
                <Col md={3} xs={6}>
                  <span className="text-muted d-block">Qualifying Marks:</span>
                  <strong className="text-dark">{application.formData?.marksPercent || 0}%</strong>
                </Col>
              </Row>
            </div>
          </Card>

          {/* Eligibility Results Checklist */}
          {application.eligibilityResult && (
            <EligibilityResultCard
              isEligible={application.eligibilityResult.passed}
              summary={application.eligibilityResult.passed ? 'All criteria rules satisfied.' : 'Some criteria rules not satisfied.'}
              criteriaResults={application.eligibilityResult.results || []}
              schemeName={scheme?.name}
            />
          )}

          {/* Uploaded Documents & OCR Inspection Cards */}
          <Card className="gov-card p-3 mb-4 border">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <ShieldCheck size={20} className="text-primary" />
              <span>Offline OCR Document Verifications ({documents.length})</span>
            </h5>

            {documents.length === 0 ? (
              <div className="text-muted small py-3 text-center">No documents uploaded.</div>
            ) : (
              <div>
                {documents.map((doc) => {
                  const openDef = openDeficiencies.find(d => 
                    (d.documentId && (d.documentId === doc._id || d.documentId?._id === doc._id)) || 
                    d.docKey === doc.docKey
                  );
                  const isActionRequired = openDef || doc.verificationStatus === 'rejected';

                  return (
                    <div key={doc._id} className="mb-4">
                      {isActionRequired && (
                        <div className="alert alert-danger py-2 px-3 mb-2 d-flex justify-content-between align-items-center flex-wrap gap-2 rounded border-danger shadow-sm">
                          <div className="d-flex align-items-center gap-2">
                            <AlertTriangle size={18} className="text-danger flex-shrink-0" />
                            <div className="small">
                              <strong className="text-danger">⚠ ACTION REQUIRED: Re-upload Needed</strong>
                              <div className="text-dark">{openDef ? openDef.reason : (doc.officerRemark || 'Discrepancy detected during verification.')}</div>
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="d-inline-flex align-items-center gap-1"
                              onClick={() => handleOpenPreview(doc)}
                            >
                              <Eye size={14} /> View Existing Document
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              className="fw-bold d-inline-flex align-items-center gap-1"
                              onClick={() => handleOpenReupload(doc, openDef)}
                            >
                              <UploadCloud size={14} /> Re-upload Document
                            </Button>
                          </div>
                        </div>
                      )}
                      <OcrResultCard document={doc} onPreview={handleOpenPreview} />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Official Stage History Audit Trail */}
          <Card className="gov-card p-3 border">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <History size={20} className="text-secondary" />
              <span>Official Stage Audit Trail</span>
            </h5>

            <div className="table-responsive">
              <Table size="sm" bordered hover className="gov-table small mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Timestamp</th>
                    <th>Stage Transition</th>
                    <th>Actor / Authority</th>
                    <th>Official Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {application.stageHistory?.map((entry, idx) => (
                    <tr key={idx}>
                      <td>{new Date(entry.at).toLocaleString('en-IN')}</td>
                      <td><StatusBadge status={entry.stage} size="sm" /></td>
                      <td className="fw-semibold">{entry.by}</td>
                      <td className="text-secondary">{entry.remark || 'Status updated'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>

          {/* Document Preview Modal */}
          <DocumentPreviewModal
            show={showPreviewModal}
            onHide={() => setShowPreviewModal(false)}
            document={previewDoc}
          />

          {/* Re-upload Document Modal */}
          <Modal show={showReuploadModal} onHide={() => setShowReuploadModal(false)} centered size="lg">
            <Modal.Header closeButton className="bg-light">
              <Modal.Title className="fs-6 fw-bold text-dark d-flex align-items-center gap-2">
                <UploadCloud size={18} className="text-primary" />
                <span>Re-upload Document: {reuploadTarget?.doc?.docKey?.replace(/_/g, ' ').toUpperCase() || reuploadTarget?.deficiency?.docKey?.replace(/_/g, ' ').toUpperCase()}</span>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              {reuploadSuccessMsg ? (
                <Alert variant="success" className="py-3 text-center">
                  <CheckCircle2 size={32} className="text-success mb-2" />
                  <div className="fw-bold fs-6">{reuploadSuccessMsg}</div>
                </Alert>
              ) : (
                <>
                  <Alert variant="warning" className="py-2 small mb-3">
                    <strong>Deficiency / Rejection Reason:</strong> {reuploadTarget?.deficiency?.reason || reuploadTarget?.doc?.officerRemark || 'Please provide a clear and updated copy of the required document.'}
                  </Alert>

                  <DocumentUploader
                    applicationId={application._id}
                    docKey={reuploadTarget?.doc?.docKey || reuploadTarget?.deficiency?.docKey}
                    label={`Replacement ${reuploadTarget?.doc?.docKey?.replace(/_/g, ' ') || reuploadTarget?.deficiency?.docKey?.replace(/_/g, ' ')}`}
                    isReupload={true}
                    currentDoc={reuploadTarget?.doc}
                    deficiencyId={reuploadTarget?.deficiency?._id}
                    onUploadSuccess={handleReuploadComplete}
                  />
                </>
              )}
            </Modal.Body>
          </Modal>
        </Col>
      </Row>
    </Container>
  );
};

export default ApplicationDetail;
