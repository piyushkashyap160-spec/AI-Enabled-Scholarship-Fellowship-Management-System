import React from 'react';
import { Card, Table, Badge, Alert } from 'react-bootstrap';
import { CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const EligibilityResultCard = ({
  isEligible,
  summary,
  criteriaResults = [],
  alternativeSchemes = [],
  schemeName = 'Selected Scheme'
}) => {
  return (
    <Card className="gov-card border shadow-sm mb-4">
      <Card.Header className={`py-3 ${isEligible ? 'bg-success text-white' : 'bg-danger text-white'}`}>
        <div className="d-flex align-items-center gap-2">
          {isEligible ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
          <div>
            <h5 className="mb-0 text-white fs-6 fw-bold">
              {isEligible ? `Eligible for ${schemeName}` : `Not Currently Eligible for ${schemeName}`}
            </h5>
            <div className="small opacity-90">{summary}</div>
          </div>
        </div>
      </Card.Header>

      <Card.Body className="p-3">
        <h6 className="fw-bold text-dark mb-3">Criteria-by-Criteria Evaluation:</h6>

        <div className="table-responsive">
          <Table bordered hover className="gov-table small align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '25%' }}>Criterion</th>
                <th style={{ width: '35%' }}>Rule Requirement</th>
                <th style={{ width: '25%' }}>Your Input / Extracted</th>
                <th style={{ width: '15%' }} className="text-center">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {criteriaResults.map((item, idx) => (
                <tr key={idx} className={item.passed ? 'table-success bg-opacity-25' : 'table-danger bg-opacity-25'}>
                  <td className="fw-bold text-capitalize">
                    {item.field.replace(/_/g, ' ')}
                  </td>
                  <td>{item.message}</td>
                  <td className="fw-semibold">
                    {typeof item.actual === 'number' && item.actual > 1000
                      ? `₹${item.actual.toLocaleString('en-IN')}`
                      : String(item.actual || 'N/A')}
                  </td>
                  <td className="text-center">
                    {item.passed ? (
                      <span className="text-success fw-bold d-inline-flex align-items-center gap-1">
                        <CheckCircle2 size={16} /> Satisfied
                      </span>
                    ) : (
                      <span className="text-danger fw-bold d-inline-flex align-items-center gap-1">
                        <XCircle size={16} /> Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* Alternative Scheme Recommendations if Ineligible */}
        {!isEligible && alternativeSchemes.length > 0 && (
          <div className="mt-4 p-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded">
            <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-bold">
              <Sparkles size={18} /> Recommended Alternative Schemes for Your Profile:
            </div>
            <div className="small text-secondary mb-2">
              Based on your entered details, you satisfy the eligibility requirements for the following schemes:
            </div>
            <div className="d-flex flex-wrap gap-2">
              {alternativeSchemes.map((alt) => (
                <Link
                  key={alt.id}
                  to={`/schemes/${alt.id}`}
                  className="btn btn-outline-primary btn-sm fw-semibold"
                >
                  {alt.name} ({alt.code}) →
                </Link>
              ))}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default EligibilityResultCard;
