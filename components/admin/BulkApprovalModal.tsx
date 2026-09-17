import React, { useState } from 'react';
import { Users, CheckCircle2, Loader2, X } from 'lucide-react';

interface BulkApprovalModalProps {
  selectedCount: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, remarks?: string) => Promise<void>;
}

export const BulkApprovalModal: React.FC<BulkApprovalModalProps> = ({
  selectedCount,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('Recruitment drive committee zero-qualification threshold waiver.');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Please enter a valid approval reason (at least 3 characters).');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onConfirm(reason.trim(), remarks.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to bulk-approve candidates. Please try again.');
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
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E5E7EB',
          width: '100%',
          maxWidth: '500px',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
      >
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
                background: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                Batch Approve for Round 2
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                Selected Candidates: <strong>{selectedCount}</strong>
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
            }}
          >
            <X size={18} />
          </button>
        </div>

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

          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#334155',
              fontSize: '0.85rem',
              lineHeight: 1.45,
              marginBottom: '1.25rem',
            }}
          >
            You are about to approve <strong>{selectedCount}</strong> candidate(s) who did not meet the standard 80% passing mark. An individual audit log will be recorded for each candidate.
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="bulkReason"
              style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}
            >
              Batch Approval Reason <span style={{ color: '#E11D48' }}>*</span>
            </label>
            <input
              id="bulkReason"
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Special threshold relaxation approved by recruitment committee"
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
              htmlFor="bulkRemarks"
              style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}
            >
              Administrative Notes (Optional)
            </label>
            <textarea
              id="bulkRemarks"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional committee memo or meeting date..."
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
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Approving Candidates...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Approve Selected ({selectedCount})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
