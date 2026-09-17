import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import { AdminCandidate } from '@/services/api/adminCandidateService';

interface AdminApprovalModalProps {
  candidate: AdminCandidate | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (applicationId: string, reason: string, remarks?: string) => Promise<void>;
}

export const AdminApprovalModal: React.FC<AdminApprovalModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('Academic excellence & campus leadership waiver.');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !candidate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Please provide a valid approval justification (at least 3 characters).');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onConfirm(candidate.applicationId, reason.trim(), remarks.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to approve candidate for Round 2. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #E5E7EB',
          width: '100%',
          maxWidth: '520px',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                Move Candidate to Round 2
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                Administrative Override & Audit Justification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Candidate Card Summary */}
          <div
            style={{
              padding: '0.95rem 1.15rem',
              borderRadius: '10px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              marginBottom: '1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Candidate</div>
              <div style={{ fontSize: '0.92rem', color: '#0F172A', fontWeight: 700, marginTop: '0.15rem' }}>
                {candidate.name}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Round 1 Score</div>
              <div style={{ fontSize: '0.92rem', color: '#B91C1C', fontWeight: 700, marginTop: '0.15rem' }}>
                {candidate.round1.score !== null ? `${candidate.round1.score} / ${candidate.round1.total || 15}` : '-'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Percentage</div>
              <div style={{ fontSize: '0.92rem', color: '#B91C1C', fontWeight: 700, marginTop: '0.15rem' }}>
                {candidate.round1.percentage !== null ? `${candidate.round1.percentage}%` : '-'}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              background: '#EFF6FF',
              border: '1px solid #DBEAFE',
              color: '#1E40AF',
              fontSize: '0.85rem',
              lineHeight: 1.45,
              marginBottom: '1.25rem',
            }}
          >
            This candidate did not meet the Round 1 passing score (80%). Are you sure you want to approve this candidate for Round 2?
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="overrideReason"
              style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}
            >
              Approval Reason / Audit Justification <span style={{ color: '#E11D48' }}>*</span>
            </label>
            <input
              id="overrideReason"
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Exceptional academic record, recommended by placement cell"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.88rem',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="overrideRemarks"
              style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}
            >
              Additional Remarks <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
            </label>
            <textarea
              id="overrideRemarks"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any internal administrative notes..."
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.88rem',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                resize: 'none',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.65rem 1.35rem',
                borderRadius: '8px',
                border: 'none',
                background: '#4F46E5',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Approving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Approve & Move to Round 2</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
