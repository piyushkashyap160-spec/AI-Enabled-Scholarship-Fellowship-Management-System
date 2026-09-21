import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { FileText, Download, AlertTriangle, RefreshCw } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const DocumentPreviewModal = ({ show, onHide, document: doc }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [contentType, setContentType] = useState('');
  const [textContent, setTextContent] = useState(null);

  const cleanupBlob = (url) => {
    if (url) {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        // ignore
      }
    }
  };

  const loadDocument = async () => {
    if (!doc || !doc._id) return;

    setLoading(true);
    setError(null);
    if (blobUrl) {
      cleanupBlob(blobUrl);
      setBlobUrl(null);
    }
    setTextContent(null);

    try {
      const res = await axiosClient.get(`/documents/${doc._id}/file`, {
        responseType: 'blob'
      });

      const rawType = res.headers['content-type'] || res.data.type || '';
      let type = rawType.split(';')[0].trim().toLowerCase();

      // Check filename extension as fallback if generic octet-stream
      const fileName = (doc.originalName || '').toLowerCase();
      if (!type || type === 'application/octet-stream') {
        if (fileName.endsWith('.pdf')) type = 'application/pdf';
        else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) type = 'image/jpeg';
        else if (fileName.endsWith('.png')) type = 'image/png';
        else if (fileName.endsWith('.webp')) type = 'image/webp';
        else if (fileName.endsWith('.txt')) type = 'text/plain';
      }

      setContentType(type);

      if (type.startsWith('text/')) {
        try {
          const text = await res.data.text();
          setTextContent(text);
        } catch (textErr) {
          setTextContent('Unable to decode text content.');
        }
      }

      const url = URL.createObjectURL(res.data);
      setBlobUrl(url);
    } catch (err) {
      console.error('Failed to load document preview:', err);
      if (err.response) {
        const status = err.response.status;
        if (status === 404) {
          setError('Document file is unavailable on the server.');
        } else if (status === 403) {
          setError('You are not authorized to view this document.');
        } else if (status === 415) {
          setError('Preview is not available for this file type.');
        } else if (err.response.data instanceof Blob) {
          try {
            const errText = await err.response.data.text();
            const errJson = JSON.parse(errText);
            setError(errJson.message || 'Failed to load document file.');
          } catch {
            setError('Failed to load document file.');
          }
        } else {
          setError(err.response.data?.message || 'Failed to load document file.');
        }
      } else {
        setError(err.message || 'Failed to load document file.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show && doc?._id) {
      loadDocument();
    } else {
      if (blobUrl) {
        cleanupBlob(blobUrl);
        setBlobUrl(null);
      }
      setError(null);
      setTextContent(null);
    }

    return () => {
      if (blobUrl) {
        cleanupBlob(blobUrl);
      }
    };
  }, [show, doc?._id]);

  const handleClose = () => {
    if (blobUrl) {
      cleanupBlob(blobUrl);
      setBlobUrl(null);
    }
    onHide();
  };

  const handleDownload = () => {
    if (!blobUrl && !doc?._id) return;
    const downloadName = doc?.originalName || `document-${doc?._id}`;
    const link = window.document.createElement('a');
    link.href = blobUrl;
    link.download = downloadName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const isPdf = contentType.includes('pdf') || (doc?.originalName || '').toLowerCase().endsWith('.pdf');
  const isImage = contentType.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp'].some(ext => (doc?.originalName || '').toLowerCase().endsWith(ext));
  const isText = contentType.startsWith('text/') || (doc?.originalName || '').toLowerCase().endsWith('.txt');

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered backdrop="static">
      <Modal.Header closeButton className="bg-light py-2 px-3 border-bottom">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <FileText size={20} className="text-primary flex-shrink-0" />
          <div>
            <div className="fw-bold text-dark fs-6 mb-0">
              {doc?.originalName || 'Document Preview'}
            </div>
            <div className="small text-muted">
              Key: <span className="text-uppercase fw-semibold">{doc?.docKey || 'N/A'}</span>
              {doc?.detectedDocType && doc?.detectedDocType !== 'unknown' && (
                <span className="ms-2 badge bg-secondary">Detected: {doc.detectedDocType}</span>
              )}
            </div>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="p-3" style={{ minHeight: '420px', maxHeight: '78vh', overflowY: 'auto' }}>
        {loading && (
          <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: '350px' }}>
            <Spinner animation="border" variant="primary" className="mb-3" />
            <div className="text-muted fw-semibold">Loading document from secure storage...</div>
            <div className="small text-secondary mt-1">Decrypting and streaming authorized file</div>
          </div>
        )}

        {!loading && error && (
          <div className="py-4 px-3">
            <Alert variant="warning" className="d-flex align-items-start gap-3 shadow-sm border-warning">
              <AlertTriangle size={24} className="text-warning flex-shrink-0 mt-1" />
              <div className="flex-grow-1">
                <strong className="d-block mb-1 fs-6">Unable to Display Document</strong>
                <p className="mb-2">{error}</p>
                <div className="d-flex gap-2 mt-3">
                  <Button variant="outline-secondary" size="sm" onClick={loadDocument}>
                    <RefreshCw size={14} className="me-1" /> Retry
                  </Button>
                </div>
              </div>
            </Alert>
          </div>
        )}

        {!loading && !error && blobUrl && (
          <div>
            {isPdf && (
              <div style={{ width: '100%', height: '70vh' }}>
                <object
                  data={blobUrl}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  className="border rounded shadow-sm w-100 h-100"
                >
                  <iframe
                    src={blobUrl}
                    width="100%"
                    height="100%"
                    title={doc?.originalName || 'PDF Viewer'}
                    className="border-0 w-100 h-100"
                  >
                    <div className="text-center p-4 bg-light rounded">
                      <p className="mb-2">Inline PDF preview is not supported by your browser.</p>
                      <Button variant="primary" size="sm" onClick={handleDownload}>
                        <Download size={14} className="me-1" /> Download PDF File
                      </Button>
                    </div>
                  </iframe>
                </object>
              </div>
            )}

            {isImage && (
              <div className="text-center p-3 bg-dark rounded d-flex align-items-center justify-content-center" style={{ minHeight: '400px', maxHeight: '72vh', overflow: 'auto' }}>
                <img
                  src={blobUrl}
                  alt={doc?.originalName || 'Document Preview'}
                  style={{ maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain' }}
                  className="rounded shadow-sm"
                />
              </div>
            )}

            {isText && (
              <div className="p-3 bg-light border rounded font-monospace small" style={{ maxHeight: '68vh', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                {textContent || 'Text file content is empty.'}
              </div>
            )}

            {!isPdf && !isImage && !isText && (
              <Alert variant="info" className="d-flex align-items-center justify-content-between p-3">
                <div>
                  <strong>Preview is not available for this file type.</strong>
                  <div className="small text-muted">You can download the original file to view it on your local device.</div>
                </div>
                <Button variant="primary" size="sm" onClick={handleDownload}>
                  <Download size={14} className="me-1" /> Download File
                </Button>
              </Alert>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="bg-light py-2 px-3 d-flex justify-content-between align-items-center">
        <div className="small text-muted text-truncate" style={{ maxWidth: '60%' }}>
          {doc?.originalName ? <span>File: <strong>{doc.originalName}</strong></span> : null}
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleDownload}
            disabled={loading || !blobUrl}
            className="d-inline-flex align-items-center gap-1"
          >
            <Download size={14} /> Download
          </Button>
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Close
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default DocumentPreviewModal;
