import React, { useState, useRef } from 'react';
import { Form, Button, ProgressBar, Alert, Spinner } from 'react-bootstrap';
import { UploadCloud, FileText, CheckCircle, AlertCircle, RefreshCw, Cpu } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const DocumentUploader = ({
  applicationId,
  docKey,
  label,
  acceptedTypes = ['pdf', 'jpg', 'png'],
  maxAgeMonths = 0,
  onUploadSuccess = null,
  currentDoc = null,
  isReupload = false,
  deficiencyId = null
}) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedDoc, setUploadedDoc] = useState(currentDoc);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 5 * 1024 * 1024) {
        setError('File exceeds 5MB limit. Please choose a smaller file.');
        return;
      }
      setError(null);
      setFile(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('docKey', docKey);
    if (deficiencyId) formData.append('deficiencyId', deficiencyId);

    try {
      let res;
      if (isReupload && uploadedDoc?._id) {
        res = await axiosClient.post(`/documents/${uploadedDoc._id}/reupload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await axiosClient.post(`/documents/${applicationId}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        const initialDoc = res.data.document;
        setUploadedDoc(initialDoc);
        setUploading(false);
        setScanning(true);

        // Start polling OCR status
        pollOcrStatus(initialDoc._id);
      }
    } catch (err) {
      setUploading(false);
      setError(err.response?.data?.message || 'Failed to upload document. Please try again.');
    }
  };

  const pollOcrStatus = (docId) => {
    let attempts = 0;
    const maxAttempts = 20;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await axiosClient.get(`/documents/${docId}/status`);
        if (res.data.success && res.data.document) {
          const doc = res.data.document;
          if (doc.ocrStatus === 'done' || doc.ocrStatus === 'failed' || attempts >= maxAttempts) {
            clearInterval(interval);
            setScanning(false);
            setUploadedDoc(doc);
            if (onUploadSuccess) onUploadSuccess(doc);
          }
        }
      } catch (e) {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setScanning(false);
        }
      }
    }, 1500); // Check every 1.5 seconds
  };

  return (
    <div className="gov-card p-3 mb-3 border">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="fw-bold text-dark fs-6 d-flex align-items-center gap-2">
          <FileText size={18} className="text-primary" />
          <span>{label}</span>
          {maxAgeMonths > 0 && (
            <span className="badge bg-info bg-opacity-10 text-info" style={{ fontSize: '0.72rem' }}>
              Valid within {maxAgeMonths} mos
            </span>
          )}
        </div>
        {uploadedDoc && !scanning && (
          <span className="badge bg-success bg-opacity-10 text-success d-inline-flex align-items-center gap-1">
            <CheckCircle size={13} /> {uploadedDoc.ocrStatus === 'done' ? 'OCR Verified' : 'Uploaded'}
          </span>
        )}
      </div>

      {error && <Alert variant="danger" className="py-2 small mb-2">{error}</Alert>}

      {/* Live OCR Scanning HUD Animation */}
      {scanning ? (
        <div className="ocr-scanner-box my-3 text-center">
          <div className="ocr-laser-line"></div>
          <div className="d-flex flex-column align-items-center justify-content-center py-2">
            <Cpu className="text-info mb-2 animate-bounce" size={32} />
            <div className="fw-bold text-info fs-6">AI OCR Scan in Progress…</div>
            <div className="small text-white-50 mt-1">
              Classifying certificate, matching keywords & extracting structured attributes
            </div>
            <div className="spinner-border spinner-border-sm text-info mt-3" role="status"></div>
          </div>
        </div>
      ) : (
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={acceptedTypes.map(t => `.${t}`).join(',')}
            className="form-control form-control-sm"
            style={{ maxWidth: '300px' }}
          />

          <Button
            variant="gov-primary"
            size="sm"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="d-flex align-items-center gap-1"
          >
            {uploading ? (
              <>
                <Spinner size="sm" animation="border" /> Uploading…
              </>
            ) : (
              <>
                <UploadCloud size={15} /> {isReupload ? 'Re-Upload & Re-Scan' : 'Upload & Scan'}
              </>
            )}
          </Button>

          {uploadedDoc?.originalName && (
            <span className="small text-muted ms-2">
              Current: <strong>{uploadedDoc.originalName}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
