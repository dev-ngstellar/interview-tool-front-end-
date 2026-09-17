'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Briefcase,
  Shield,
  LogOut,
  ListFilter,
  PlusCircle,
  LayoutDashboard,
  Clock,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface AssessmentHeaderState {
  isActive: boolean;
  roundTitle: string;
  timeRemaining: string;
  isUrgent: boolean;
  isWarning: boolean;
  isSecureMode?: boolean;
  violationCount?: number;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, student, role, logout } = useAuth();
  const isAdminRoute = pathname.startsWith('/admin');
  const isCandidateRoute = pathname === '/' || pathname.startsWith('/student');

  const [assessmentHeader, setAssessmentHeader] = useState<AssessmentHeaderState | null>(null);

  // Listen for assessment header updates from active assessment screens
  useEffect(() => {
    const handleAssessmentHeaderUpdate = (event: any) => {
      if (event?.detail) {
        setAssessmentHeader(event.detail);
      }
    };

    window.addEventListener('assessment-header-update', handleAssessmentHeaderUpdate);
    return () => {
      window.removeEventListener('assessment-header-update', handleAssessmentHeaderUpdate);
    };
  }, []);

  // Clear assessment header if navigating away from candidate assessment routes
  useEffect(() => {
    if (!pathname.startsWith('/student/assessment') && !pathname.startsWith('/student/round-2')) {
      setAssessmentHeader(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    logout();
    if (isAdminRoute) {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  const isAssessmentActive = Boolean(
    assessmentHeader?.isActive &&
      (pathname.startsWith('/student/assessment') || pathname.startsWith('/student/round-2'))
  );

  // Eliminate duplicate dark navbar on all administrative routes
  if (isAdminRoute) {
    return null;
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: '68px',
        display: 'flex',
        alignItems: 'center',
        backdropFilter: isCandidateRoute ? 'none' : 'blur(16px)',
        backgroundColor: isCandidateRoute ? '#ffffff' : 'rgba(11, 15, 25, 0.9)',
        borderBottom: isCandidateRoute
          ? '1px solid #E5E7EB'
          : '1px solid rgba(255, 255, 255, 0.08)',
        color: isCandidateRoute ? '#111827' : '#f9fafb',
        boxShadow: isCandidateRoute ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          gap: '1rem',
          maxWidth: '1440px',
          width: '95%',
          margin: '0 auto',
        }}
      >
        {/* Left Branding & Assessment Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          {isAssessmentActive ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'inherit',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                <Briefcase size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    letterSpacing: '-0.01em',
                    color: '#111827',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                  }}
                >
                  Marketing Executive Drive
                </div>
                <div style={{ fontSize: '0.74rem', color: '#6b7280', lineHeight: 1.2 }}>
                  Campus Recruitment Assessment
                </div>
              </div>
            </div>
          ) : (
            <Link
              href={isAdminRoute ? '/admin' : '/'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: isAdminRoute
                    ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                    : '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {isAdminRoute ? <Shield size={20} /> : <Briefcase size={20} />}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    letterSpacing: '-0.01em',
                    color: isCandidateRoute ? '#111827' : '#ffffff',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                  }}
                >
                  Marketing Executive Drive
                </div>
                <div style={{ fontSize: '0.74rem', color: isCandidateRoute ? '#6b7280' : 'var(--text-muted)', lineHeight: 1.2 }}>
                  {isAdminRoute ? 'Admin Portal & Governance' : 'Campus Recruitment Assessment'}
                </div>
              </div>
            </Link>
          )}

          {/* Assessment Context Tag (Embedded in Navbar during active assessment) */}
          {isAssessmentActive && assessmentHeader?.roundTitle && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '0.85rem',
                borderLeft: '1px solid #E5E7EB',
                marginLeft: '0.25rem',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  background: '#EEF2FF',
                  border: '1px solid #C7D2FE',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#4338CA',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {assessmentHeader.roundTitle}
              </span>
            </div>
          )}
        </div>

        {/* Right Section: Navigation & Session / Active Assessment Controls */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'nowrap' }}>
          {isAssessmentActive ? (
            /* Active Assessment Header: Compact Timer Badge + Candidate Name (NO EXIT BUTTON) */
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {assessmentHeader?.isSecureMode && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    background:
                      (assessmentHeader.violationCount || 0) > 0 ? '#FEF2F2' : '#F0FDF4',
                    border:
                      (assessmentHeader.violationCount || 0) > 0
                        ? '1px solid #FECACA'
                        : '1px solid #BBF7D0',
                    color:
                      (assessmentHeader.violationCount || 0) > 0 ? '#B91C1C' : '#15803D',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}
                  title="Secure Assessment Mode Active"
                >
                  <Lock size={12} />
                  <span>Secure Mode</span>
                  {(assessmentHeader.violationCount || 0) > 0 && (
                    <span
                      style={{
                        marginLeft: '0.2rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '9999px',
                        backgroundColor: '#DC2626',
                        color: '#FFFFFF',
                        fontSize: '0.7rem',
                      }}
                    >
                      {assessmentHeader.violationCount}/3
                    </span>
                  )}
                </div>
              )}

              {assessmentHeader?.timeRemaining && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '9999px',
                    background: assessmentHeader.isUrgent
                      ? '#fef2f2'
                      : assessmentHeader.isWarning
                        ? '#fffbeb'
                        : '#f8fafc',
                    border: assessmentHeader.isUrgent
                      ? '1.5px solid #ef4444'
                      : assessmentHeader.isWarning
                        ? '1.5px solid #f59e0b'
                        : '1px solid #E2E8F0',
                    color: assessmentHeader.isUrgent
                      ? '#b91c1c'
                      : assessmentHeader.isWarning
                        ? '#b45309'
                        : '#1e293b',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    fontFamily: 'var(--font-mono)',
                    boxShadow: assessmentHeader.isUrgent
                      ? '0 0 0 2px rgba(239, 68, 68, 0.15)'
                      : 'none',
                    transition: 'all 0.2s ease',
                  }}
                  aria-label={`Assessment Timer: ${assessmentHeader.timeRemaining} remaining`}
                  role="timer"
                >
                  {assessmentHeader.isUrgent ? (
                    <AlertTriangle size={15} color="#ef4444" />
                  ) : (
                    <Clock
                      size={15}
                      color={
                        assessmentHeader.isWarning
                          ? '#f59e0b'
                          : '#4f46e5'
                      }
                    />
                  )}
                  <span>{assessmentHeader.timeRemaining} Remaining</span>
                </div>
              )}

              {(student?.fullName || user?.email) && (
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: '#475569',
                    fontWeight: 500,
                    padding: '0.3rem 0.75rem',
                    borderRadius: '6px',
                    background: '#f8fafc',
                    border: '1px solid #E2E8F0',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Candidate:{' '}
                  <strong style={{ color: '#1e293b' }}>
                    {student?.fullName || user?.email?.split('@')[0]}
                  </strong>
                </div>
              )}
            </div>
          ) : (
            /* Minimal Student Header (outside active assessment) */
            user && role === 'STUDENT' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: isCandidateRoute ? '#374151' : 'var(--text-primary)',
                    fontWeight: 500,
                    padding: '0.35rem 0.8rem',
                    borderRadius: 'var(--radius-full)',
                    background: isCandidateRoute ? '#eef2ff' : 'rgba(99, 102, 241, 0.12)',
                    border: isCandidateRoute
                      ? '1px solid #c7d2fe'
                      : '1px solid rgba(99, 102, 241, 0.25)',
                  }}
                >
                  Candidate:{' '}
                  <strong style={{ color: isCandidateRoute ? '#4338ca' : '#818cf8' }}>
                    {student?.fullName || user.email.split('@')[0]}
                  </strong>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  title="Exit assessment session"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <LogOut size={13} />
                  <span>Exit</span>
                </button>
              </div>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
