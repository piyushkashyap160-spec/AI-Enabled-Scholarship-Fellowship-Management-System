import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { AlertCircle } from 'lucide-react';

const ConfirmModal = ({
  show,
  onHide,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  requiresInput = false,
  inputLabel = 'Remarks / Reason',
  inputPlaceholder = 'Please enter justification...',
  inputValue = '',
  onInputChange = null,
  isProcessing = false
}) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
          <AlertCircle size={18} className={`text-${confirmVariant}`} />
          <span>{title}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3 text-secondary">{message}</p>

        {requiresInput && (
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">{inputLabel}</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => onInputChange && onInputChange(e.target.value)}
              required
            />
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer className="bg-light py-2">
        <Button variant="outline-secondary" size="sm" onClick={onHide} disabled={isProcessing}>
          {cancelText}
        </Button>
        <Button
          variant={confirmVariant}
          size="sm"
          onClick={onConfirm}
          disabled={isProcessing || (requiresInput && !inputValue.trim())}
          className="fw-semibold"
        >
          {isProcessing ? 'Processing…' : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;
