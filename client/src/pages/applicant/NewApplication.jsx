import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import DocumentUploader from '../../components/DocumentUploader';
import OcrResultCard from '../../components/OcrResultCard';
import EligibilityResultCard from '../../components/EligibilityResultCard';
import { FilePlus, Check, ArrowRight, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';

const NewApplication = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [schemes, setSchemes] = useState([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState(searchParams.get('schemeId') || '');
  const [scheme, setScheme] = useState(null);
  const [formData, setFormData] = useState({});
  const [application, setApplication] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([]);

  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [rulesEvalResult, setRulesEvalResult] = useState(null);

  // 1. Fetch Schemes
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await axiosClient.get('/schemes?active=true');
        if (res.data.success) {
          setSchemes(res.data.schemes || []);
          if (!selectedSchemeId && res.data.schemes?.length > 0) {
            setSelectedSchemeId(res.data.schemes[0]._id);
          }
        }
      } catch (e) {}
    };
    fetchSchemes();
  }, []);

  // 2. Fetch Selected Scheme configuration
  useEffect(() => {
    if (!selectedSchemeId) return;
    const fetchSchemeDetails = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/schemes/${selectedSchemeId}`);
        if (res.data.success) {
          const s = res.data.scheme;
          setScheme(s);

          // Initialize form data with real user profile values or empty strings
          const initialData = {};
          s.formFields?.forEach(f => {
            if (f.key === 'marksPercent') initialData[f.key] = user?.profile?.education?.marksPercent ?? '';
            else if (f.key === 'familyIncome') initialData[f.key] = user?.profile?.familyIncome ?? '';
            else if (f.key === 'university') initialData[f.key] = user?.profile?.education?.university || '';
            else if (f.key === 'course') initialData[f.key] = user?.profile?.education?.course || '';
            else initialData[f.key] = '';
          });
          setFormData(initialData);
        }
      } catch (e) {
        setError('Failed to load scheme details.');
      } finally {
        setLoading(false);
      }
    };
    fetchSchemeDetails();
  }, [selectedSchemeId, user]);

  const handleFormFieldChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Step 1 -> Create Draft Application
  const handleProceedToDocs = async (e) => {
    e.preventDefault();
    setSavingDraft(true);
    setError(null);

    try {
      if (!application) {
        const res = await axiosClient.post('/applications', {
          schemeId: selectedSchemeId,
          formData
        });
        if (res.data.success) {
          setApplication(res.data.application);
          setStep(2);
        }
      } else {
        const res = await axiosClient.put(`/applications/${application._id}`, { formData });
        if (res.data.success) {
          setApplication(res.data.application);
          setStep(2);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save application draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Step 2 -> Refresh uploaded documents list
  const handleUploadSuccess = async (doc) => {
    if (!application) return;
    try {
      const res = await axiosClient.get(`/applications/${application._id}`);
      if (res.data.success) {
        setUploadedDocs(res.data.documents || []);
      }
    } catch {}
  };

  // Step 2 -> Proceed to Review
  const handleProceedToReview = async () => {
    if (!application) return;
    setError(null);

    // Fetch latest documents
    try {
      const res = await axiosClient.get(`/applications/${application._id}`);
      if (res.data.success) {
        const docs = res.data.documents || [];
        setUploadedDocs(docs);

        // Check required documents
        const reqKeys = (scheme?.requiredDocuments || []).filter(d => d.required).map(d => d.key);
        const uploadedKeys = docs.map(d => d.docKey);
        const missing = reqKeys.filter(k => !uploadedKeys.includes(k));

        if (missing.length > 0) {
          setError(`Please upload all mandatory documents before continuing: ${missing.join(', ')}`);
          return;
        }

        // Run local evaluation pre-check for review step
        const evalRes = await axiosClient.post('/eligibility/check', {
          schemeId: selectedSchemeId,
          ...formData,
          category: user?.profile?.category || 'ST',
          marksPercent: formData.marksPercent || user?.profile?.education?.marksPercent,
          familyIncome: formData.familyIncome || user?.profile?.familyIncome,
          educationLevel: user?.profile?.education?.level || 'masters'
        });

        if (evalRes.data.success) {
          setRulesEvalResult(evalRes.data);
        }

        setStep(3);
      }
    } catch (err) {
      setError('Failed to prepare application review.');
    }
  };

  // Step 3 -> Final Official Submission
  const handleFinalSubmit = async () => {
    if (!application) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await axiosClient.post(`/applications/${application._id}/submit`);
      if (res.data.success) {
        navigate(`/applicant/applications/${application._id}?submitted=true`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container fluid className="py-4 px-lg-4">
      <Row className="gy-4">
        <Col lg={3} md={4}>
          <Sidebar />
        </Col>

        <Col lg={9} md={8}>
          {/* Multi-Step Header Stepper */}
          <Card className="gov-card p-3 mb-4 border">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <FilePlus size={22} className="text-primary" />
                  <span>New Scholarship Application</span>
                </h4>
                {application && (
                  <div className="small text-muted mt-1">
                    Application Ref: <strong>{application.applicationNo}</strong>
                  </div>
                )}
              </div>

              {/* Step Badges */}
              <div className="d-flex gap-2">
                <span className={`badge ${step >= 1 ? 'bg-primary' : 'bg-light text-dark'} px-2.5 py-1.5`}>
                  1. Form Details
                </span>
                <span className={`badge ${step >= 2 ? 'bg-primary' : 'bg-light text-dark'} px-2.5 py-1.5`}>
                  2. Document OCR
                </span>
                <span className={`badge ${step >= 3 ? 'bg-primary' : 'bg-light text-dark'} px-2.5 py-1.5`}>
                  3. Rules & Submit
                </span>
              </div>
            </div>
          </Card>

          {error && <Alert variant="danger" className="py-2.5 small mb-4">{error}</Alert>}

          {/* STEP 1: SCHEME SELECTION & DYNAMIC FORM FIELDS */}
          {step === 1 && (
            <Card className="gov-card p-4 border">
              <h5 className="fw-bold text-dark mb-3">Step 1: Scheme Details & Academic Declarations</h5>

              <Form onSubmit={handleProceedToDocs}>
                {/* Scheme Choice */}
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold">Select Scholarship / Fellowship Scheme</Form.Label>
                  <Form.Select
                    value={selectedSchemeId}
                    onChange={(e) => setSelectedSchemeId(e.target.value)}
                    required
                  >
                    {schemes.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.code}) — {s.level.toUpperCase()}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {loading ? (
                  <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
                ) : (
                  <>
                    <h6 className="fw-bold text-primary border-bottom pb-1 mb-3">
                      Required Declarations for {scheme?.code}
                    </h6>

                    <Row className="gy-3">
                      {scheme?.formFields?.map((field) => (
                        <Col md={field.type === 'textarea' ? 12 : 6} key={field.key}>
                          <Form.Group>
                            <Form.Label className="small fw-bold">
                              {field.label} {field.required && <span className="text-danger">*</span>}
                            </Form.Label>

                            {field.type === 'select' ? (
                              <Form.Select
                                value={formData[field.key] || ''}
                                onChange={(e) => handleFormFieldChange(field.key, e.target.value)}
                                required={field.required}
                              >
                                <option value="">Select an option</option>
                                {field.options?.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </Form.Select>
                            ) : field.type === 'textarea' ? (
                              <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData[field.key] || ''}
                                onChange={(e) => handleFormFieldChange(field.key, e.target.value)}
                                required={field.required}
                              />
                            ) : (
                              <Form.Control
                                type={field.type === 'number' ? 'number' : (field.type === 'date' ? 'date' : 'text')}
                                step={field.type === 'number' ? 'any' : undefined}
                                value={formData[field.key] || ''}
                                onChange={(e) => handleFormFieldChange(field.key, e.target.value)}
                                required={field.required}
                              />
                            )}

                            {field.helpText && (
                              <Form.Text className="text-muted small">{field.helpText}</Form.Text>
                            )}
                          </Form.Group>
                        </Col>
                      ))}
                    </Row>
                  </>
                )}

                <div className="d-flex justify-content-end mt-4">
                  <Button
                    type="submit"
                    variant="gov-primary"
                    className="fw-bold px-4 py-2 d-flex align-items-center gap-2"
                    disabled={savingDraft || loading}
                  >
                    {savingDraft ? <Spinner size="sm" animation="border" /> : <>Save & Proceed to Documents <ArrowRight size={16} /></>}
                  </Button>
                </div>
              </Form>
            </Card>
          )}

          {/* STEP 2: DOCUMENT UPLOAD & OFFLINE OCR SCANNING */}
          {step === 2 && (
            <div>
              <Card className="gov-card p-4 border mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div>
                    <h5 className="fw-bold text-dark mb-1">Step 2: Upload Supporting Documents</h5>
                    <p className="text-muted small mb-0">
                      Upload mandatory certificates. Local AI OCR will classify, extract details, and flag any discrepancies instantly.
                    </p>
                  </div>
                </div>

                <div className="alert alert-info py-2 small mb-3">
                  <strong>Demo Tip:</strong> For testing OCR verification, upload files from <code>server/uploads/samples/</code>. The system will extract certificate numbers, dates, marks, and income automatically.
                </div>

                {/* Uploaders for each required document */}
                {scheme?.requiredDocuments?.map((reqDoc) => {
                  const existingDoc = uploadedDocs.find(d => d.docKey === reqDoc.key);

                  return (
                    <div key={reqDoc.key} className="mb-3">
                      <DocumentUploader
                        applicationId={application?._id}
                        docKey={reqDoc.key}
                        label={reqDoc.label}
                        acceptedTypes={reqDoc.acceptedTypes}
                        maxAgeMonths={reqDoc.maxAgeMonths}
                        onUploadSuccess={handleUploadSuccess}
                        currentDoc={existingDoc}
                      />

                      {/* Display OCR Result Card if verified */}
                      {existingDoc && existingDoc.ocrStatus === 'done' && (
                        <OcrResultCard document={existingDoc} />
                      )}
                    </div>
                  );
                })}

                <div className="d-flex justify-content-between mt-4">
                  <Button variant="outline-secondary" onClick={() => setStep(1)} className="fw-semibold">
                    <ArrowLeft size={16} className="me-1" /> Back to Form
                  </Button>
                  <Button variant="gov-primary" onClick={handleProceedToReview} className="fw-bold px-4">
                    Proceed to Review & Pre-Check <ArrowRight size={16} className="ms-1" />
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* STEP 3: REVIEW & FINAL RULES CHECK */}
          {step === 3 && (
            <div>
              <Card className="gov-card p-4 border mb-4">
                <h5 className="fw-bold text-dark mb-3">Step 3: Automated Eligibility Assessment & Final Submit</h5>

                {/* Rules Evaluation Checklist */}
                {rulesEvalResult && (
                  <EligibilityResultCard
                    isEligible={rulesEvalResult.isEligible}
                    summary={rulesEvalResult.summary}
                    criteriaResults={rulesEvalResult.criteriaResults}
                    schemeName={scheme?.name}
                  />
                )}

                {/* Summary of Uploaded Documents */}
                <div className="p-3 bg-light rounded mb-4">
                  <h6 className="fw-bold text-dark mb-2">Verified Documents Summary ({uploadedDocs.length}):</h6>
                  <div className="d-flex flex-column gap-1 small">
                    {uploadedDocs.map(d => (
                      <div key={d._id} className="d-flex justify-content-between align-items-center">
                        <span>• <strong>{d.docKey.replace(/_/g, ' ').toUpperCase()}</strong>: {d.originalName}</span>
                        <span className={`badge ${d.mismatches?.length === 0 ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {d.mismatches?.length === 0 ? 'High Confidence OK' : `${d.mismatches.length} Flags`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-warning bg-opacity-10 border border-warning rounded mb-4 small text-dark">
                  <strong>Final Declaration:</strong> I hereby declare that all information entered and documents uploaded are authentic. I understand that human officers will scrutinize this application and any discrepancy will be recorded in the official audit log.
                </div>

                <div className="d-flex justify-content-between">
                  <Button variant="outline-secondary" onClick={() => setStep(2)} className="fw-semibold">
                    <ArrowLeft size={16} className="me-1" /> Back to Documents
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleFinalSubmit}
                    disabled={submitting}
                    className="fw-bold px-4 py-2 shadow"
                  >
                    {submitting ? <Spinner size="sm" animation="border" /> : 'Confirm & Submit Application 🚀'}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default NewApplication;
