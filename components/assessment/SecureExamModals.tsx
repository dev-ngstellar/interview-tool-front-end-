'use client';

import React from 'react';
import {
  ShieldAlert,
  Maximize2,
  AlertTriangle,
  Lock,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

interface PreExamFullscreenModalProps {
  isOpen: boolean;
  onEnterFullscreen: () => void;
  driveName?: string;
  roundName?: string;
}

export const PreExamFullscreenModal: React.FC<PreExamFullscreenModalProps> = ({
  isOpen,
  onEnterFullscreen,
  driveName = 'Marketing Executive Recruitment Drive',
  roundName = 'Candidate Assessment',
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div
          style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
            color: '#FFFFFF',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <Lock size={28} color="#FFFFFF" />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
            Secure Assessment Mode
          </h2>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', opacity: 0.9 }}>
            {driveName} • {roundName}
          </p>
        </div>

        <div style={{ padding: '1.75rem 1.5rem' }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.98rem',
              color: '#334155',
              lineHeight: 1.55,
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            To continue, the assessment must be completed in fullscreen mode.
          </p>

          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1rem',
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              fontSize: '0.8rem',
              color: '#64748B',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '0.35rem' }}>
              🔒 Environment Notice:
            </div>
            • Tab switching and window exits will be recorded.<br />
            • Text selection, dragging, and shortcut copying are disabled.<br />
            • The authoritative server timer will run without interruption.
          </div>

          <button
            type="button"
            onClick={onEnterFullscreen}
            style={{
              width: '100%',
              marginTop: '1.5rem',
              padding: '0.85rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
            }}
          >
            <Maximize2 size={18} />
            <span>Enter Fullscreen</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface FullscreenRequiredModalProps {
  isOpen: boolean;
  onReturnToFullscreen: () => void;
  violationCount: number;
  maxViolations?: number;
}

export const FullscreenRequiredModal: React.FC<FullscreenRequiredModalProps> = ({
  isOpen,
  onReturnToFullscreen,
  violationCount,
  maxViolations = 3,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#FEF2F2',
            borderBottom: '1px solid #FEE2E2',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.85rem',
            }}
          >
            <AlertTriangle size={26} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#991B1B' }}>
            Assessment Fullscreen Required
          </h3>
          <div
            style={{
              marginTop: '0.45rem',
              display: 'inline-block',
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              backgroundColor: '#FEE2E2',
              color: '#B91C1C',
              fontSize: '0.74rem',
              fontWeight: 700,
            }}
          >
            Environment Violation {Math.min(violationCount, maxViolations)} of {maxViolations}
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.94rem',
              color: '#334155',
              lineHeight: 1.55,
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            Please return to fullscreen mode to continue your assessment.
          </p>

          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 0.95rem',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: '#92400E',
              lineHeight: 1.5,
            }}
          >
            ⚠️ <strong>Critical notice:</strong> The assessment timer continues running. Repeatedly
            exiting fullscreen will cause the assessment to be automatically submitted.
          </div>

          <button
            type="button"
            onClick={onReturnToFullscreen}
            style={{
              width: '100%',
              marginTop: '1.25rem',
              padding: '0.85rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
            }}
          >
            <Maximize2 size={16} />
            <span>Return to Fullscreen</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface SecurityWarningModalProps {
  isOpen: boolean;
  onContinue: () => void;
  violationCount: number;
  maxViolations?: number;
  customTitle?: string;
  customMessage?: string;
}

export const SecurityWarningModal: React.FC<SecurityWarningModalProps> = ({
  isOpen,
  onContinue,
  violationCount,
  maxViolations = 3,
  customTitle,
  customMessage,
}) => {
  if (!isOpen) return null;

  const isFinalWarning = violationCount >= 2;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: isFinalWarning ? '#FEF2F2' : '#FFFBEB',
            borderBottom: `1px solid ${isFinalWarning ? '#FEE2E2' : '#FDE68A'}`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: isFinalWarning ? '#FEE2E2' : '#FEF3C7',
              color: isFinalWarning ? '#DC2626' : '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.85rem',
            }}
          >
            <ShieldAlert size={28} />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 800,
              color: isFinalWarning ? '#991B1B' : '#92400E',
            }}
          >
            {customTitle || 'Assessment Security Warning'}
          </h3>
          <div
            style={{
              marginTop: '0.45rem',
              display: 'inline-block',
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              backgroundColor: isFinalWarning ? '#FEE2E2' : '#FEF3C7',
              color: isFinalWarning ? '#991B1B' : '#B45309',
              fontSize: '0.74rem',
              fontWeight: 700,
            }}
          >
            Security Violation {Math.min(violationCount, maxViolations)} of {maxViolations}{' '}
            {isFinalWarning ? '• FINAL WARNING' : ''}
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.92rem',
              color: '#334155',
              lineHeight: 1.55,
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            {customMessage ||
              'You left the assessment window. Please remain on the assessment page until the assessment is completed.'}
          </p>

          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 0.95rem',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              fontSize: '0.78rem',
              color: '#64748B',
              lineHeight: 1.45,
            }}
          >
            • The authoritative countdown timer has continued running.<br />
            • Your previously finalized answers remain securely locked.<br />
            {isFinalWarning ? (
              <span style={{ color: '#DC2626', fontWeight: 700 }}>
                • ⚠️ Next violation will immediately trigger automated evaluation submission.
              </span>
            ) : (
              <span>• A maximum of {maxViolations} environment violations is permitted.</span>
            )}
          </div>

          <button
            type="button"
            onClick={onContinue}
            style={{
              width: '100%',
              marginTop: '1.25rem',
              padding: '0.85rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: isFinalWarning ? '#DC2626' : '#4F46E5',
              color: '#FFFFFF',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <span>Continue Assessment</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface AutoSubmitModalProps {
  isOpen: boolean;
}

export const AutoSubmitModal: React.FC<AutoSubmitModalProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          textAlign: 'center',
          padding: '2rem 1.5rem',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <XCircle size={32} />
        </div>

        <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
          Assessment Submitted
        </h3>

        <p
          style={{
            marginTop: '0.75rem',
            fontSize: '0.92rem',
            color: '#64748B',
            lineHeight: 1.55,
          }}
        >
          Your assessment was submitted because the secure assessment environment was exited
          multiple times.
        </p>

        <div
          style={{
            marginTop: '1.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            backgroundColor: '#F1F5F9',
            color: '#475569',
            fontSize: '0.82rem',
            fontWeight: 600,
          }}
        >
          <Loader2 size={16} className="animate-spin" color="#4F46E5" />
          <span>Finalizing evaluation score...</span>
        </div>
      </div>
    </div>
  );
};

interface NavigationWarningModalProps {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export const NavigationWarningModal: React.FC<NavigationWarningModalProps> = ({
  isOpen,
  onStay,
  onLeave,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          padding: '1.75rem 1.5rem',
          textAlign: 'center',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <AlertTriangle size={28} />
        </div>

        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
          Assessment in Progress
        </h3>

        <p
          style={{
            margin: '0.5rem 0 1.5rem 0',
            fontSize: '0.92rem',
            color: '#64748B',
            lineHeight: 1.55,
          }}
        >
          Leaving this page will interrupt your assessment. The authoritative timer will continue
          counting down.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onStay}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Stay in Assessment
          </button>
          <button
            type="button"
            onClick={onLeave}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#64748B',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Leave Assessment
          </button>
        </div>
      </div>
    </div>
  );
};
