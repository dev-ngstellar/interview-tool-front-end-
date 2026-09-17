'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  LogOut,
  Sparkles,
} from 'lucide-react';
import {
  assessmentService,
  FinalResultResponse,
} from '@/services/api/assessmentService';

export default function StudentCompletionPage() {
  const router = useRouter();
  const { user, student, role, logout, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [finalResult, setFinalResult] = useState<FinalResultResponse | null>(null);
  const [logoutCountdown, setLogoutCountdown] = useState(20);

  const candidateName =
    student?.fullName ||
    (user as any)?.name ||
    user?.email?.split('@')[0] ||
    'Candidate';

  useEffect(() => {
    if (!authLoading && (!user || role !== 'STUDENT')) {
      router.push('/');
    }
  }, [user, role, authLoading, router]);

  useEffect(() => {
    async function loadResult() {
      try {
        const data = await assessmentService.getFinalResult();
        setFinalResult(data);
      } catch (err) {
        console.warn('Could not load final result on completion page:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user && role === 'STUDENT') {
      loadResult();
    }
  }, [user, role]);

  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      setLogoutCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          try {
            logout();
          } catch (e) {
            console.warn('Logout error', e);
          }
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, logout, router]);

  const handleFinishAndSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      router.push('/');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-primary)', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading your assessment result...</p>
      </div>
    );
  }

  const isQualified = finalResult?.finalStatus === 'QUALIFIED' || finalResult?.round2?.passed === true;
  const finalStatus = isQualified ? 'QUALIFIED' : 'NOT QUALIFIED';

  const r1Score = finalResult?.round1
    ? `${finalResult.round1.obtainedMarks} / ${finalResult.round1.totalQuestions}`
    : '12 / 15';
  const r1Percentage = finalResult?.round1 ? `${finalResult.round1.percentage}%` : '80%';
  const r1Passed = finalResult?.round1 ? finalResult.round1.passed : true;

  const r2Score = finalResult?.round2
    ? `${finalResult.round2.obtainedMarks} / ${finalResult.round2.totalQuestions}`
    : '13 / 15';
  const r2Percentage = finalResult?.round2 ? `${finalResult.round2.percentage}%` : '86.67%';

  return (
    <div className="container" style={{ maxWidth: '720px', margin: '2.5rem auto' }}>
      <div
        className="glass-card"
        style={{
          padding: '3rem 2.5rem',
          textAlign: 'center',
          background: '#ffffff',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Drive Badge */}
        <div
          className="badge badge-neutral"
          style={{
            padding: '0.45rem 1.25rem',
            marginBottom: '1rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontSize: '0.82rem',
            fontWeight: 700,
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #E5E7EB',
          }}
        >
          {finalResult?.driveName || 'MARKETING EXECUTIVE'}
        </div>

        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            marginBottom: '0.5rem',
            color: '#111827',
          }}
        >
          FINAL ASSESSMENT RESULT
        </h1>

        <div
          style={{
            fontSize: '0.92rem',
            color: '#6b7280',
            marginBottom: '2rem',
          }}
        >
          Candidate: <strong style={{ color: '#111827' }}>{candidateName}</strong>
        </div>

        {/* Dual Round Score Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          {/* Round 1 Score Box */}
          <div
            style={{
              background: '#f9fafb',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              padding: '1.5rem 1.25rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.5rem',
              }}
            >
              Round 1 Score
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                marginBottom: '0.25rem',
                color: '#111827',
              }}
            >
              {r1Score}
            </div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--accent-primary)',
                marginBottom: '0.75rem',
              }}
            >
              {r1Percentage}
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                background: '#dcfce7',
                color: '#15803d',
                border: '1px solid #86efac',
              }}
            >
              {r1Passed ? 'PASSED' : 'NOT QUALIFIED'}
            </span>
          </div>

          {/* Round 2 Score Box */}
          <div
            style={{
              background: '#f9fafb',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              padding: '1.5rem 1.25rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.5rem',
              }}
            >
              Round 2 Score
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                marginBottom: '0.25rem',
                color: isQualified ? '#15803d' : '#b91c1c',
              }}
            >
              {r2Score}
            </div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: isQualified ? '#15803d' : '#b91c1c',
                marginBottom: '0.75rem',
              }}
            >
              {r2Percentage}
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                background: isQualified ? '#dcfce7' : '#fee2e2',
                color: isQualified ? '#15803d' : '#b91c1c',
                border: isQualified ? '1px solid #86efac' : '1px solid #fecaca',
              }}
            >
              {isQualified ? 'QUALIFIED' : 'NOT QUALIFIED'}
            </span>
          </div>
        </div>

        {/* Final Overall Status Banner */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '12px',
            background: isQualified ? '#ecfdf5' : '#fef2f2',
            border: isQualified ? '1.5px solid #86efac' : '1.5px solid #fecaca',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: isQualified ? '#15803d' : '#b91c1c',
              marginBottom: '0.35rem',
            }}
          >
            Final Status
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: isQualified ? '#15803d' : '#b91c1c',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {isQualified ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            <span>{finalStatus}</span>
          </div>
        </div>

        {/* Thank You & Guidance Message */}
        <div
          style={{
            padding: '1.5rem',
            background: '#f9fafb',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            marginBottom: '2rem',
            textAlign: 'center',
          }}
        >
          {isQualified ? (
            <div style={{ color: '#4b5563', lineHeight: 1.7, fontSize: '0.96rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#111827' }}>
                Thank you for participating in the {finalResult?.driveName || 'Marketing Executive'} recruitment assessment.
              </p>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                Your assessment has been successfully completed.
              </p>
              <p style={{ margin: 0, color: '#6b7280' }}>
                You will be contacted regarding the next stage of the recruitment process.
              </p>
            </div>
          ) : (
            <div style={{ color: '#4b5563', lineHeight: 1.7, fontSize: '0.96rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#111827' }}>
                Thank you for participating in the recruitment assessment.
              </p>
              <p style={{ margin: 0 }}>
                Your assessment has been completed.
              </p>
            </div>
          )}
        </div>

        {/* Auto Logout Progress Indicator & Manual Logout Button */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem',
              color: '#6b7280',
            }}
          >
            <Loader2 size={16} className="animate-spin" />
            <span>Signing you out in {logoutCountdown}s...</span>
          </div>

          <button
            onClick={handleFinishAndSignOut}
            className="btn btn-primary"
            style={{
              padding: '0.75rem 2.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              borderRadius: '8px',
            }}
          >
            <LogOut size={16} />
            <span>Finish & Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
