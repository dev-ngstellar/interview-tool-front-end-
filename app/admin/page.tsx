'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { AdminApprovalModal } from '@/components/admin/AdminApprovalModal';
import { BulkApprovalModal } from '@/components/admin/BulkApprovalModal';
import { CandidateDetailsDrawer } from '@/components/admin/CandidateDetailsDrawer';
import {
  adminCandidateService,
  DashboardStatsData,
  AdminCandidate,
} from '@/services/api/adminCandidateService';
import {
  Shield,
  Lock,
  Mail,
  AlertCircle,
  LogIn,
  Eye,
  EyeOff,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Briefcase,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

export default function AdminPortalPage() {
  const { user, role, loginAdmin, loading: authLoading } = useAuth();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dashboard metrics state
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedForBulk, setSelectedForBulk] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedCandidateForApproval, setSelectedCandidateForApproval] = useState<AdminCandidate | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedApplicationIdForDetails, setSelectedApplicationIdForDetails] = useState<string | null>(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user || role !== 'ADMIN') return;
    try {
      setLoadingStats(true);
      const data = await adminCandidateService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [user, role]);

  useEffect(() => {
    if (user && role === 'ADMIN') {
      fetchStats();
    }
  }, [user, role, fetchStats]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both administrative email and password.');
      return;
    }

    try {
      setSubmitting(true);
      await loginAdmin(email.trim(), password);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Invalid administrator credentials. Candidate accounts cannot access this portal.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSingleApprovalConfirm = async (applicationId: string, reason: string, remarks?: string) => {
    const res = await adminCandidateService.overrideRound2(applicationId, reason, remarks);
    setActionNotice(res.message);
    setTimeout(() => setActionNotice(null), 5000);
    await fetchStats();
  };

  const handleBulkApprovalConfirm = async (reason: string, remarks?: string) => {
    if (selectedForBulk.length === 0) return;
    const res = await adminCandidateService.bulkOverrideRound2(selectedForBulk, reason, remarks);
    setActionNotice(res.message);
    setSelectedForBulk([]);
    setTimeout(() => setActionNotice(null), 5000);
    await fetchStats();
  };

  const toggleSelectCandidate = (appId: string) => {
    setSelectedForBulk((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId],
    );
  };

  const toggleSelectAllFailed = () => {
    if (!stats?.adminReviewCandidates) return;
    const allIds = stats.adminReviewCandidates.map((c) => c.applicationId);
    if (selectedForBulk.length === allIds.length) {
      setSelectedForBulk([]);
    } else {
      setSelectedForBulk(allIds);
    }
  };

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          color: '#64748B',
          gap: '0.75rem',
        }}
      >
        <Loader2 size={32} className="animate-spin" color="#4F46E5" />
        <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>Verifying administrative session...</span>
      </div>
    );
  }

  // ============================================================================
  // 1. ADMIN LOGIN — LIGHT THEME
  // ============================================================================
  if (!user || role !== 'ADMIN') {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}
      >
        <div
          style={{
            maxWidth: '440px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            padding: '2.5rem 2.25rem',
          }}
        >
          {/* Brand Icon */}
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              margin: '0 auto 1.25rem',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            }}
          >
            <Shield size={26} />
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                display: 'inline-block',
                fontSize: '0.74rem',
                fontWeight: 800,
                color: '#4F46E5',
                backgroundColor: '#EEF2FF',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.45rem',
              }}
            >
              ADMIN PORTAL
            </div>
            <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#111827', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
              Marketing Executive Drive
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#6B7280', margin: 0 }}>
              Authorized administrative sign-in.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label
                htmlFor="adminEmail"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.4rem',
                }}
              >
                <Mail size={13} color="#6B7280" />
                <span>Admin Email</span>
              </label>
              <input
                id="adminEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.test"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.95rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  fontSize: '0.92rem',
                  color: '#111827',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="adminPassword"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.4rem',
                }}
              >
                <Lock size={13} color="#6B7280" />
                <span>Password</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="adminPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '0.7rem 2.5rem 0.7rem 0.95rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.92rem',
                    color: '#111827',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#4F46E5',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Student Portal Link */}
          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #E5E7EB',
              textAlign: 'center',
              fontSize: '0.8rem',
              color: '#6B7280',
            }}
          >
            <span>Student candidate? </span>
            <Link href="/" style={{ color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>
              Return to Candidate Registration
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. ADMIN DASHBOARD — LIGHT/LITE THEME
  // ============================================================================
  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                fontSize: '0.76rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                marginBottom: '0.45rem',
              }}
            >
              <Shield size={12} />
              <span>Campus Recruitment Drive 2026</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
              Recruitment Executive Dashboard
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Real-time candidate metrics, pass/fail evaluation pipeline, and administrative override governance.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              onClick={() => fetchStats()}
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={15} className={loadingStats ? 'animate-spin' : ''} />
              <span>Refresh Metrics</span>
            </button>
            <Link
              href="/admin/candidates"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                backgroundColor: '#4F46E5',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Users size={15} />
              <span>View All Candidates</span>
            </Link>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: '8px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle2 size={18} color="#059669" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Section 19: Zero Qualified Scenario Alert Banner */}
        {stats?.zeroQualified && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: '12px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#F59E0B',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#92400E' }}>
                  Special Attention: No Candidates Qualified Round 1
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#B45309' }}>
                  Zero candidates met the 80% passing threshold for Round 1. Use the Admin Review section below to manually select and approve candidates for Round 2.
                </p>
              </div>
            </div>

            {selectedForBulk.length > 0 && (
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: '#D97706',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)',
                }}
              >
                <ShieldCheck size={16} />
                <span>Approve Selected ({selectedForBulk.length}) for Round 2</span>
              </button>
            )}
          </div>
        )}

        {/* Section 3: 6 Dashboard Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.15rem' }}>
          <StatCard
            label="Total Candidates"
            value={stats?.totalCandidates ?? 0}
            subtext="Registered for drive"
            icon={<Users size={20} />}
            accentColor="#4F46E5"
          />

          <StatCard
            label="Round 1 Completed"
            value={stats?.round1Completed ?? 0}
            subtext="Aptitude assessment taken"
            icon={<Clock size={20} />}
            accentColor="#6366F1"
          />

          <StatCard
            label="Round 1 Passed"
            value={stats?.round1Passed ?? 0}
            subtext="Scored ≥ 80% pass benchmark"
            icon={<CheckCircle2 size={20} />}
            accentColor="#16A34A"
          />

          <StatCard
            label="Round 1 Failed"
            value={stats?.round1Failed ?? 0}
            subtext="Scored < 80% pass benchmark"
            icon={<XCircle size={20} />}
            accentColor="#DC2626"
          />

          <StatCard
            label="Round 2 In Progress"
            value={stats?.round2InProgress ?? 0}
            subtext="Currently taking Round 2"
            icon={<Clock size={20} />}
            accentColor="#0284C7"
          />

          <StatCard
            label="Qualified"
            value={stats?.qualified ?? 0}
            subtext="Successfully completed drive"
            icon={<Award size={20} />}
            accentColor="#059669"
          />

          <StatCard
            label="Security Events"
            value={stats?.securityMetrics?.totalEvents ?? 0}
            subtext={`${stats?.securityMetrics?.candidatesWithEvents ?? 0} candidate(s) with events`}
            icon={<ShieldAlert size={20} />}
            accentColor="#D97706"
          />
        </div>

        {/* Section 4: Recruitment Progress Breakdown */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
          }}
        >
          {/* Round 1 Pipeline */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              padding: '1.35rem 1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                Round 1: Aptitude Assessment Funnel
              </h3>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                Benchmark 80%
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>REGISTERED</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                  {stats?.pipeline?.round1?.registered ?? 0}
                </div>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#EFF6FF', border: '1px solid #DBEAFE' }}>
                <div style={{ fontSize: '0.72rem', color: '#1E40AF', fontWeight: 600 }}>IN PROGRESS</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D4ED8', marginTop: '0.2rem' }}>
                  {stats?.pipeline?.round1?.inProgress ?? 0}
                </div>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: '0.72rem', color: '#065F46', fontWeight: 600 }}>PASSED</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                  {stats?.pipeline?.round1?.passed ?? 0}
                </div>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: '0.72rem', color: '#991B1B', fontWeight: 600 }}>FAILED</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#DC2626', marginTop: '0.2rem' }}>
                  {stats?.pipeline?.round1?.failed ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* Round 2 Pipeline */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              padding: '1.35rem 1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                Round 2: Communication Funnel
              </h3>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#10B981', background: '#D1FAE5', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                Benchmark 75%
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>ELIGIBLE</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                  {stats?.pipeline?.round2?.eligible ?? 0}
                </div>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#EFF6FF', border: '1px solid #DBEAFE' }}>
                <div style={{ fontSize: '0.72rem', color: '#1E40AF', fontWeight: 600 }}>IN PROGRESS</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D4ED8', marginTop: '0.2rem' }}>
                  {stats?.pipeline?.round2?.inProgress ?? 0}
                </div>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: '0.72rem', color: '#065F46', fontWeight: 600 }}>QUALIFIED</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                  {stats?.pipeline?.round2?.passed ?? 0}
                </div>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: '0.72rem', color: '#991B1B', fontWeight: 600 }}>FAILED</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#DC2626', marginTop: '0.2rem' }}>
                  {stats?.pipeline?.round2?.failed ?? 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 18: Round 1 Failed — Admin Review */}
        {stats?.adminReviewCandidates && stats.adminReviewCandidates.length > 0 && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #FDE68A',
              padding: '1.5rem',
              boxShadow: '0 1px 4px rgba(245, 158, 11, 0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#92400E' }}>
                  Round 1 Failed — Admin Review
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem', color: '#B45309' }}>
                  Candidates who scored below 80% in Round 1 and are eligible for administrative waiver to Round 2.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={toggleSelectAllFailed}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #FCD34D',
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {selectedForBulk.length === stats.adminReviewCandidates.length ? 'Deselect All' : 'Select All'}
                </button>

                {selectedForBulk.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(true)}
                    style={{
                      padding: '0.45rem 0.95rem',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#D97706',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Approve Selected ({selectedForBulk.length})
                  </button>
                )}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FFFBEB', borderBottom: '1px solid #FDE68A', color: '#92400E' }}>
                    <th style={{ padding: '0.65rem 0.85rem', width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedForBulk.length === stats.adminReviewCandidates.length && stats.adminReviewCandidates.length > 0}
                        onChange={toggleSelectAllFailed}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>Candidate</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>Student ID</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>Round 1 Score</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>Percentage</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>Status</th>
                    <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.adminReviewCandidates.map((c) => (
                    <tr key={c.applicationId} style={{ borderBottom: '1px solid #FEF3C7' }}>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedForBulk.includes(c.applicationId)}
                          onChange={() => toggleSelectCandidate(c.applicationId)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#0F172A' }}>
                        {c.name}
                        <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 400 }}>{c.email}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.82rem', color: '#4F46E5', backgroundColor: '#EEF2FF', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          {c.studentId || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#B91C1C' }}>
                        {c.round1.score !== null ? `${c.round1.score} / ${c.round1.total || 15}` : '-'}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#B91C1C' }}>
                        {c.round1.percentage !== null ? `${c.round1.percentage}%` : '-'}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <StatusBadge status="FAILED" />
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setSelectedCandidateForApproval(c);
                            setIsApprovalModalOpen(true);
                          }}
                          type="button"
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#4F46E5',
                            color: '#FFFFFF',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span>Move to Round 2</span>
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 17: Recent Candidates Table */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                Recent Candidate Applications
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Latest students registered for the Marketing Executive campus drive.
              </p>
            </div>

            <Link
              href="/admin/candidates"
              style={{
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#4F46E5',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>View All Candidates</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Candidate</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Student ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Round 1</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Round 2</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Overall Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {!stats?.recentCandidates || stats.recentCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      No registered candidates recorded yet.
                    </td>
                  </tr>
                ) : (
                  stats.recentCandidates.map((c) => (
                    <tr key={c.applicationId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{c.name}</div>
                        <div style={{ fontSize: '0.76rem', color: '#64748B' }}>{c.email}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.82rem', color: '#4F46E5', backgroundColor: '#EEF2FF', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          {c.studentId || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {c.round1.score !== null ? (
                          <span>
                            <strong>{c.round1.score}/{c.round1.total || 15}</strong> ({c.round1.percentage}%)
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {c.round2.score !== null ? (
                          <span>
                            <strong>{c.round2.score}/{c.round2.total || 15}</strong> ({c.round2.percentage}%)
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <StatusBadge status={c.overallStatus} />
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setSelectedApplicationIdForDetails(c.applicationId);
                            setIsDetailsDrawerOpen(true);
                          }}
                          type="button"
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#FFFFFF',
                            color: '#475569',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Single Candidate Override Modal */}
      <AdminApprovalModal
        candidate={selectedCandidateForApproval}
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setSelectedCandidateForApproval(null);
        }}
        onConfirm={handleSingleApprovalConfirm}
      />

      {/* Bulk Approval Modal */}
      <BulkApprovalModal
        selectedCount={selectedForBulk.length}
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onConfirm={handleBulkApprovalConfirm}
      />

      {/* Candidate Details Drawer */}
      <CandidateDetailsDrawer
        applicationId={selectedApplicationIdForDetails}
        isOpen={isDetailsDrawerOpen}
        onClose={() => {
          setIsDetailsDrawerOpen(false);
          setSelectedApplicationIdForDetails(null);
        }}
        onMoveToRound2={(candidate) => {
          setIsDetailsDrawerOpen(false);
          setSelectedCandidateForApproval(candidate);
          setIsApprovalModalOpen(true);
        }}
      />
    </AdminLayout>
  );
}
