'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CandidateDetails } from '@/services/api/authService';
import {
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Shield,
  Phone,
  Mail,
  User,
  IdCard,
  Lock,
  Loader2,
  GraduationCap,
} from 'lucide-react';

export default function CandidateRegistrationPage() {
  const router = useRouter();
  const { user, student, role, requestOtp, loading: authLoading, logout, application } = useAuth();

  const [formData, setFormData] = useState<CandidateDetails>({
    fullName: '',
    studentId: '',
    email: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [completedEmail, setCompletedEmail] = useState<string>('');

  // Clean URL if query params exist and prepopulate form if returning or draft exists
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (student) {
      setFormData({
        fullName: student.fullName || '',
        studentId: (student as any).studentId || '',
        email: student.email || '',
        phone: student.phone || '',
      });
    } else if (typeof window !== 'undefined') {
      const draftEmail = localStorage.getItem('candidate_draft_email');
      const draftStudentId = localStorage.getItem('candidate_draft_student_id');
      const draftFullName = localStorage.getItem('candidate_draft_name');
      const draftPhone = localStorage.getItem('candidate_draft_phone');
      setFormData((prev) => ({
        ...prev,
        email: draftEmail || prev.email,
        studentId: draftStudentId || prev.studentId,
        fullName: draftFullName || prev.fullName,
        phone: draftPhone || prev.phone,
      }));
    }
  }, [student]);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'fullName': {
        const trimmed = value.trim().replace(/\s+/g, ' ');
        if (!trimmed || trimmed.length < 2 || !/^[a-zA-Z\s]{2,}$/.test(trimmed)) {
          return 'Please enter a valid name.';
        }
        return '';
      }
      case 'studentId': {
        const trimmed = value.trim();
        if (!trimmed) {
          return 'Please enter your Student ID.';
        }
        return '';
      }
      case 'email': {
        const trimmed = value.trim().toLowerCase();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!trimmed || !emailRegex.test(trimmed)) {
          return 'Please enter a valid email address.';
        }
        return '';
      }
      case 'phone': {
        const digits = value.replace(/\D/g, '');
        if (digits.length !== 10 || !/^[6-9]\d{9}$/.test(digits)) {
          return 'Please enter a valid 10-digit mobile number.';
        }
        return '';
      }
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'phone') {
      newValue = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (errorMessage) setErrorMessage(null);
    if (successMessage) setSuccessMessage(null);

    // As user corrects the field, clear error if valid
    if (fieldErrors[name]) {
      const error = validateField(name, newValue);
      if (!error) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [name]: error }));
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side validation for ALL four fields
    const newErrors: Record<string, string> = {};
    const fieldOrder = ['fullName', 'studentId', 'email', 'phone'];

    for (const field of fieldOrder) {
      const err = validateField(field, formData[field as keyof typeof formData]);
      if (err) {
        newErrors[field] = err;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      // Automatically focus first invalid field
      const firstInvalid = fieldOrder.find((f) => newErrors[f]);
      if (firstInvalid) {
        const el = document.getElementById(firstInvalid);
        if (el) el.focus();
      }
      return;
    }

    setFieldErrors({});

    try {
      setLoading(true);
      const normalizedPayload = {
        fullName: formData.fullName.trim().replace(/\s+/g, ' '),
        studentId: formData.studentId.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim().replace(/\D/g, ''),
      };

      const res = await requestOtp(normalizedPayload);

      // Backend confirmed successful email delivery:
      if (res?.success) {
        setSuccessMessage('Verification code sent successfully. Redirecting...');

        // Save candidate details in client state for OTP verification screen
        if (typeof window !== 'undefined') {
          localStorage.setItem('candidate_draft_email', normalizedPayload.email);
          localStorage.setItem('candidate_draft_student_id', normalizedPayload.studentId);
          localStorage.setItem('candidate_draft_name', normalizedPayload.fullName);
          localStorage.setItem('candidate_draft_phone', normalizedPayload.phone);
        }

        // Short transition to let candidate see confirmation before navigating
        setTimeout(() => {
          router.push('/student/verify-otp');
        }, 500);
      } else {
        setErrorMessage("We couldn't send the verification code. Please try again.");
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (
        err?.code === 'ASSESSMENT_ALREADY_COMPLETED' ||
        err?.statusCode === 409 ||
        msg.toLowerCase().includes('already completed')
      ) {
        setAlreadyCompleted(true);
        setCompletedEmail(formData.email.trim().toLowerCase());
        return;
      }

      // Check for duplicate Student ID
      if (msg.includes('already registered') || msg.toLowerCase().includes('student id is already registered')) {
        setFieldErrors((prev) => ({ ...prev, studentId: 'This Student ID is already registered.' }));
        const el = document.getElementById('studentId');
        if (el) el.focus();
        return;
      }

      setErrorMessage(msg || "We couldn't send the verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // State: Candidate with this email has already completed assessment (Requirement 7 & 14)
  if (alreadyCompleted) {
    return (
      <div className="candidate-light-theme" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: '640px', margin: '2rem auto' }}>
          <div
            className="glass-card"
            style={{
              textAlign: 'center',
              padding: '3rem 2.5rem',
              background: '#ffffff',
              border: '1px solid #fecaca',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                color: '#ef4444',
              }}
            >
              <Shield size={32} />
            </div>

            <div
              className="badge badge-neutral"
              style={{
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                marginBottom: '1rem',
                fontWeight: 700,
              }}
            >
              ASSESSMENT ALREADY COMPLETED
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', color: '#111827' }}>
              Assessment Already Completed
            </h2>

            <p
              style={{
                color: '#4b5563',
                fontSize: '1rem',
                lineHeight: 1.6,
                maxWidth: '480px',
                margin: '0 auto 2rem',
              }}
            >
              This email address (<strong style={{ color: '#111827' }}>{completedEmail}</strong>) has already completed the Marketing Executive recruitment assessment.
              <br />
              <br />
              Thank you for participating.
            </p>

            <button
              onClick={() => {
                setAlreadyCompleted(false);
                setFormData((prev) => ({ ...prev, email: '' }));
              }}
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.75rem' }}
            >
              Enter Another Email Address
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If already verified as student and assessment is ready
  if (!authLoading && user && role === 'STUDENT') {
    const isCompleted = [
      'QUALIFIED',
      'COMMUNICATION_FAILED',
      'APTITUDE_FAILED',
      'COMMUNICATION_PASSED',
    ].includes(application?.currentStatus || '');

    if (isCompleted) {
      return (
        <div className="candidate-light-theme" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
          <div className="container" style={{ maxWidth: '640px', margin: '2rem auto' }}>
            <div
              className="glass-card"
              style={{
                textAlign: 'center',
                padding: '3rem 2.5rem',
                background: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background:
                    application?.currentStatus === 'QUALIFIED'
                      ? '#ecfdf5'
                      : '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  color:
                    application?.currentStatus === 'QUALIFIED'
                      ? '#15803d'
                      : '#ef4444',
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <div
                className="badge badge-neutral"
                style={{
                  marginBottom: '0.75rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                }}
              >
                <span>RECRUITMENT RECORD FINALIZED</span>
              </div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#111827' }}>
                Assessment Already Completed
              </h2>

              <p
                style={{
                  color: '#4b5563',
                  fontSize: '0.98rem',
                  lineHeight: 1.6,
                  maxWidth: '480px',
                  margin: '0 auto 2rem',
                }}
              >
                You have already completed the Marketing Executive recruitment assessment.
                <br />
                Thank you for participating.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => router.push('/student/round-2')}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  View Final Assessment Result
                </button>
                <button
                  onClick={() => logout()}
                  className="btn btn-secondary"
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="candidate-light-theme" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: '640px', margin: '2rem auto' }}>
          <div
            className="glass-card"
            style={{
              textAlign: 'center',
              padding: '2.5rem 2rem',
              background: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#15803d',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <div
              className="badge badge-neutral"
              style={{
                marginBottom: '0.75rem',
                background: '#ecfdf5',
                color: '#15803d',
                border: '1px solid #86efac',
                fontWeight: 600,
              }}
            >
              <span>Identity Verified</span>
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#111827' }}>
              Welcome, {student?.fullName || user.email}
            </h2>

            <p
              style={{
                color: '#4b5563',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                maxWidth: '460px',
                margin: '0 auto 2rem',
              }}
            >
              Your candidate details have been verified. Your Round 1 Aptitude Assessment is ready to launch.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '340px', margin: '0 auto' }}>
              <button
                onClick={() => router.push('/student/assessment')}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem' }}
              >
                <span>Continue to Assessment</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-light-theme" style={{ minHeight: '100%', padding: '1rem 0 2.5rem' }}>
      <div className="container" style={{ maxWidth: '680px', margin: '0 auto' }}>
        {/* Page Hero */}
        <section
          style={{
            textAlign: 'center',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            className="badge badge-neutral"
            style={{
              padding: '0.4rem 1.1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderRadius: '9999px',
              background: '#f3f4f6',
              border: '1px solid #E5E7EB',
              color: '#374151',
            }}
          >
            <GraduationCap size={16} color="#4F46E5" />
            <span style={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem' }}>
              MARKETING EXECUTIVE • CAMPUS RECRUITMENT
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.9rem, 3.5vw, 2.3rem)',
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              color: '#111827',
              margin: 0,
            }}
          >
            Candidate Registration
          </h1>

          <p
            style={{
              fontSize: '0.98rem',
              color: '#6B7280',
              lineHeight: 1.55,
              maxWidth: '520px',
              margin: 0,
            }}
          >
            Enter your details below to receive a 6-digit verification code and begin your Round 1
            Aptitude Assessment.
          </p>
        </section>

        {/* Registration Card */}
        <div
          className="glass-card"
          style={{
            padding: '2.25rem 2rem',
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          }}
        >
          {errorMessage && (
            <div
              style={{
                padding: '0.85rem 1.1rem',
                borderRadius: '8px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '1.5rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                padding: '0.85rem 1.1rem',
                borderRadius: '8px',
                background: '#ECFDF5',
                border: '1px solid #86EFAC',
                color: '#15803D',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '1.5rem',
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          <form
            action="#"
            method="post"
            noValidate
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}
          >
            {/* Row 1: Student Name | Student ID */}
            <div className="candidate-grid-2">
              <div className="candidate-form-group">
                <label htmlFor="fullName" className="candidate-label">
                  <User size={15} color="#4F46E5" />
                  <span>Student Name *</span>
                </label>
                <div className="candidate-input-wrapper">
                  <User size={17} className="candidate-input-icon" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your full name"
                    className={`candidate-input ${fieldErrors.fullName ? 'has-error' : ''}`}
                    disabled={loading}
                  />
                </div>
                {fieldErrors.fullName && (
                  <span className="candidate-field-error">
                    <AlertCircle size={13} />
                    {fieldErrors.fullName}
                  </span>
                )}
              </div>

              <div className="candidate-form-group">
                <label htmlFor="studentId" className="candidate-label">
                  <IdCard size={15} color="#4F46E5" />
                  <span>Student ID *</span>
                </label>
                <div className="candidate-input-wrapper">
                  <IdCard size={17} className="candidate-input-icon" />
                  <input
                    id="studentId"
                    name="studentId"
                    type="text"
                    required
                    value={formData.studentId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your student ID"
                    className={`candidate-input ${fieldErrors.studentId ? 'has-error' : ''}`}
                    disabled={loading}
                  />
                </div>
                {fieldErrors.studentId && (
                  <span className="candidate-field-error">
                    <AlertCircle size={13} />
                    {fieldErrors.studentId}
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: Email Address | Phone Number */}
            <div className="candidate-grid-2">
              <div className="candidate-form-group">
                <label htmlFor="email" className="candidate-label">
                  <Mail size={15} color="#4F46E5" />
                  <span>Email Address *</span>
                </label>
                <div className="candidate-input-wrapper">
                  <Mail size={17} className="candidate-input-icon" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your email address"
                    className={`candidate-input ${fieldErrors.email ? 'has-error' : ''}`}
                    disabled={loading}
                  />
                </div>
                {fieldErrors.email && (
                  <span className="candidate-field-error">
                    <AlertCircle size={13} />
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div className="candidate-form-group">
                <label htmlFor="phone" className="candidate-label">
                  <Phone size={15} color="#4F46E5" />
                  <span>Phone Number *</span>
                </label>
                <div className="candidate-input-wrapper">
                  <Phone size={17} className="candidate-input-icon" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your 10-digit mobile number"
                    className={`candidate-input ${fieldErrors.phone ? 'has-error' : ''}`}
                    disabled={loading}
                  />
                </div>
                {fieldErrors.phone && (
                  <span className="candidate-field-error">
                    <AlertCircle size={13} />
                    {fieldErrors.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Secure OTP Information */}
            <div
              style={{
                padding: '0.85rem 1.15rem',
                borderRadius: '10px',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.84rem',
                color: '#1E40AF',
                lineHeight: 1.5,
                marginTop: '0.2rem',
              }}
            >
              <Lock size={18} color="#4F46E5" style={{ flexShrink: 0 }} />
              <span>
                Your identity is verified via a secure one-time passcode (OTP).
              </span>
            </div>

            {/* Primary CTA */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                height: '48px',
                fontSize: '0.98rem',
                fontWeight: 700,
                marginTop: '0.2rem',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>Get OTP</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

