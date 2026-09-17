'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Edit3,
  CheckCircle,
} from 'lucide-react';

export default function VerifyOtpPage() {
  const router = useRouter();
  const { verifyOtp, requestOtp } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(60);
  const [alreadyCompleted, setAlreadyCompleted] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load candidate email from secure client state (never from URL query parameters)
  useEffect(() => {
    // If URL has query parameters, strip them immediately
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('candidate_draft_email');
      if (stored) {
        setEmail(stored);
      } else {
        // No email in session, redirect to candidate details form
        router.push('/');
      }
    }
  }, [router]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    setErrorMessage(null);
    setResendSuccess(null);

    // Handle paste of 6 digits
    if (value.length > 1) {
      const cleaned = value.replace(/\D/g, '').slice(0, 6);
      if (cleaned.length > 0) {
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = cleaned[i] || '';
        }
        setDigits(newDigits);
        const nextIndex = Math.min(cleaned.length, 5);
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    // Single digit input
    const cleanChar = value.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = cleanChar;
    setDigits(newDigits);

    // Auto-advance to next input
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResendSuccess(null);

    const otp = digits.join('');
    if (otp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!email) {
      setErrorMessage('Candidate email not detected. Please return to details screen.');
      return;
    }

    try {
      setLoading(true);
      await verifyOtp(email, otp);
      // Clean draft email
      if (typeof window !== 'undefined') {
        localStorage.removeItem('candidate_draft_email');
      }
      // Navigate straight to assessment introduction
      router.push('/student/assessment');
    } catch (err: any) {
      if (
        err?.code === 'ASSESSMENT_ALREADY_COMPLETED' ||
        err?.statusCode === 409 ||
        err?.message?.toLowerCase()?.includes('already completed')
      ) {
        setAlreadyCompleted(true);
        return;
      }
      setErrorMessage(
        err?.message || 'Incorrect verification code or code has expired. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email) return;

    try {
      setResending(true);
      setErrorMessage(null);
      setResendSuccess(null);

      const draftStudentId = typeof window !== 'undefined' ? localStorage.getItem('candidate_draft_student_id') || '' : '';
      const draftName = typeof window !== 'undefined' ? localStorage.getItem('candidate_draft_name') || 'Candidate' : 'Candidate';
      const draftPhone = typeof window !== 'undefined' ? localStorage.getItem('candidate_draft_phone') || '' : '';

      // Re-request OTP using draft or fallback details
      await requestOtp({
        email,
        fullName: draftName,
        studentId: draftStudentId,
        phone: draftPhone,
      });

      setResendSuccess(`A fresh verification code has been sent to ${email}`);
      setCooldown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      if (
        err?.code === 'ASSESSMENT_ALREADY_COMPLETED' ||
        err?.statusCode === 409 ||
        err?.message?.toLowerCase()?.includes('already completed')
      ) {
        setAlreadyCompleted(true);
        return;
      }
      setErrorMessage(err?.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (alreadyCompleted) {
    return (
      <div className="container" style={{ maxWidth: '640px', margin: '4rem auto' }}>
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '3rem 2.5rem',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: '#ef4444',
            }}
          >
            <AlertCircle size={32} />
          </div>

          <div
            className="badge badge-neutral"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              marginBottom: '1rem',
            }}
          >
            ASSESSMENT ALREADY COMPLETED
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Assessment Already Completed
          </h2>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              lineHeight: 1.6,
              maxWidth: '480px',
              margin: '0 auto 2rem',
            }}
          >
            This email address (<strong style={{ color: 'var(--text-primary)' }}>{email}</strong>) has already completed the Marketing Executive recruitment assessment.
            <br />
            <br />
            Thank you for participating.
          </p>

          <button onClick={() => router.push('/')} className="btn btn-secondary">
            Return to Candidate Entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '520px', margin: '2rem auto' }}>
      <div className="glass-card" style={{ padding: '2.75rem 2rem', textAlign: 'center' }}>
        {/* Verification Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: 'var(--accent-primary)',
          }}
        >
          <ShieldCheck size={32} />
        </div>

        <div className="badge badge-neutral" style={{ marginBottom: '0.75rem' }}>
          <span>Step 2 of 3 • Verification</span>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Verify Your Details
        </h1>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            marginBottom: '1.75rem',
          }}
        >
          We’ve sent a 6-digit verification code to
          <br />
          <strong style={{ color: 'var(--text-primary)' }}>{email || 'your email address'}</strong>
        </p>

        {/* Alert Messages */}
        {errorMessage && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--status-error-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--status-error)',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              textAlign: 'left',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {resendSuccess && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--status-success-bg)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--status-success)',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              textAlign: 'left',
            }}
          >
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{resendSuccess}</span>
          </div>
        )}

        {/* OTP Input Form */}
        <form
          action="#"
          method="post"
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}
        >
          <div
            onPaste={handlePaste}
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.6rem',
            }}
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                style={{
                  width: '48px',
                  height: '56px',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: digit ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'all var(--transition-fast)',
                  boxShadow: digit ? '0 0 15px rgba(99, 102, 241, 0.25)' : 'none',
                }}
              />
            ))}
          </div>

          {/* Primary CTA */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || digits.join('').length !== 6}
            style={{
              width: '100%',
              padding: '0.9rem 1.5rem',
              fontSize: '1.02rem',
              fontWeight: 700,
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
            }}
          >
            {loading ? (
              <span>Verifying Code...</span>
            ) : (
              <>
                <span>Verify & Continue</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Resend & Edit Details Controls */}
        <div
          style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div>
            Didn’t receive the code?{' '}
            {cooldown > 0 ? (
              <span style={{ color: 'var(--text-muted)' }}>Resend code in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                <span>Resend OTP</span>
              </button>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => router.push('/')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <Edit3 size={13} />
              <span>Entered incorrect details? Edit details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
