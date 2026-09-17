'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { AdminApprovalModal } from '@/components/admin/AdminApprovalModal';
import { CandidateDetailsDrawer } from '@/components/admin/CandidateDetailsDrawer';
import {
  adminCandidateService,
  AdminCandidate,
  PaginationMeta,
} from '@/services/api/adminCandidateService';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Download,
} from 'lucide-react';

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [round1Filter, setRound1Filter] = useState('ALL');
  const [round2Filter, setRound2Filter] = useState('ALL');
  const [overallFilter, setOverallFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('registrationDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal / Drawer state
  const [selectedCandidateForApproval, setSelectedCandidateForApproval] = useState<AdminCandidate | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedApplicationIdForDetails, setSelectedApplicationIdForDetails] = useState<string | null>(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminCandidateService.listCandidates({
        search: searchTerm,
        round1Status: round1Filter,
        round2Status: round2Filter,
        overallStatus: overallFilter,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: 10,
      });
      setCandidates(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err: any) {
      console.error('Failed to fetch candidates:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, round1Filter, round2Filter, overallFilter, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleOpenApproval = (candidate: AdminCandidate) => {
    setSelectedCandidateForApproval(candidate);
    setIsApprovalModalOpen(true);
  };

  const handleConfirmApproval = async (applicationId: string, reason: string, remarks?: string) => {
    const res = await adminCandidateService.overrideRound2(applicationId, reason, remarks);
    setActionNotice(res.message);
    setTimeout(() => setActionNotice(null), 5000);
    await fetchCandidates();
  };

  const handleOpenDetails = (applicationId: string) => {
    setSelectedApplicationIdForDetails(applicationId);
    setIsDetailsDrawerOpen(true);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
              Candidate Applications
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Comprehensive applicant roster, two-round assessment outcomes, and administrative waivers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              onClick={() => fetchCandidates()}
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
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
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
            <ShieldCheck size={18} color="#059669" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Search & Filters Bar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '1.15rem 1.4rem',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Search Row */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
              />
              <input
                type="text"
                placeholder="Search candidate name, student ID, email, or mobile..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem 0.6rem 2.4rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem',
                  backgroundColor: '#F8FAFC',
                }}
              />
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '0.2rem' }}>
                  ROUND 1
                </label>
                <select
                  value={round1Filter}
                  onChange={(e) => {
                    setRound1Filter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.84rem',
                    backgroundColor: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">All R1 Status</option>
                  <option value="PASSED">Passed</option>
                  <option value="FAILED">Failed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '0.2rem' }}>
                  ROUND 2
                </label>
                <select
                  value={round2Filter}
                  onChange={(e) => {
                    setRound2Filter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.84rem',
                    backgroundColor: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">All R2 Status</option>
                  <option value="PASSED">Passed</option>
                  <option value="FAILED">Failed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '0.2rem' }}>
                  OVERALL STATUS
                </label>
                <select
                  value={overallFilter}
                  onChange={(e) => {
                    setOverallFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.84rem',
                    backgroundColor: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">All Stages</option>
                  <option value="REGISTERED">Registered</option>
                  <option value="ADMIN_REVIEW">Admin Review</option>
                  <option value="ADMIN_APPROVED">Admin Approved</option>
                  <option value="ROUND_2">Round 2 Pipeline</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="NOT_QUALIFIED">Not Qualified</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                  <th style={{ padding: '0.85rem 1rem', cursor: 'pointer' }} onClick={() => toggleSort('name')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>Student Name</span>
                      <ArrowUpDown size={13} color="#94A3B8" />
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 1rem', cursor: 'pointer' }} onClick={() => toggleSort('studentId')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>Student ID</span>
                      <ArrowUpDown size={13} color="#94A3B8" />
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Phone Number</th>
                  <th style={{ padding: '0.85rem 1rem', cursor: 'pointer' }} onClick={() => toggleSort('r1Score')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>Round 1 Score</span>
                      <ArrowUpDown size={13} color="#94A3B8" />
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 1rem' }}>Round 1 Status</th>
                  <th style={{ padding: '0.85rem 1rem', cursor: 'pointer' }} onClick={() => toggleSort('r2Score')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>Round 2 Score</span>
                      <ArrowUpDown size={13} color="#94A3B8" />
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 1rem' }}>Round 2 Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Overall Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      <Loader2 size={28} className="animate-spin" color="#4F46E5" style={{ margin: '0 auto 0.5rem' }} />
                      <span>Loading candidate roster...</span>
                    </td>
                  </tr>
                ) : candidates.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      No candidate records found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  candidates.map((c) => {
                    const isR1Failed = c.round1.status === 'FAILED';
                    const isR1Passed = c.round1.status === 'PASSED';
                    const isR2Passed = c.round2.status === 'PASSED';

                    return (
                      <tr
                        key={c.applicationId}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background-color 0.12s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                      >
                        {/* Student Name */}
                        <td style={{ padding: '0.95rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{c.name}</div>
                        </td>

                        {/* Student ID */}
                        <td style={{ padding: '0.95rem 1rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              fontSize: '0.84rem',
                              color: '#4F46E5',
                              backgroundColor: '#EEF2FF',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              border: '1px solid #C7D2FE',
                            }}
                          >
                            {c.studentId || '-'}
                          </span>
                        </td>

                        {/* Email */}
                        <td style={{ padding: '0.95rem 1rem', color: '#334155', fontSize: '0.84rem' }}>
                          {c.email}
                        </td>

                        {/* Phone Number */}
                        <td style={{ padding: '0.95rem 1rem', color: '#475569', fontSize: '0.84rem' }}>
                          {c.phone}
                        </td>

                        {/* Round 1 Score */}
                        <td style={{ padding: '0.95rem 1rem' }}>
                          {c.round1.score !== null ? (
                            <div>
                              <strong style={{ color: '#0F172A', fontSize: '0.92rem' }}>
                                {c.round1.score} / {c.round1.total || 15}
                              </strong>
                              <span style={{ fontSize: '0.78rem', color: isR1Passed ? '#15803D' : '#B91C1C', marginLeft: '0.35rem' }}>
                                ({c.round1.percentage}%)
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>-</span>
                          )}
                        </td>

                        {/* Round 1 Status */}
                        <td style={{ padding: '0.95rem 1rem' }}>
                          <StatusBadge status={c.round1.status} />
                        </td>

                        {/* Round 2 Score */}
                        <td style={{ padding: '0.95rem 1rem' }}>
                          {c.round2.score !== null ? (
                            <div>
                              <strong style={{ color: '#0F172A', fontSize: '0.92rem' }}>
                                {c.round2.score} / {c.round2.total || 15}
                              </strong>
                              <span style={{ fontSize: '0.78rem', color: isR2Passed ? '#15803D' : '#B91C1C', marginLeft: '0.35rem' }}>
                                ({c.round2.percentage}%)
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>-</span>
                          )}
                        </td>

                        {/* Round 2 Status */}
                        <td style={{ padding: '0.95rem 1rem' }}>
                          <StatusBadge status={c.round2.status} />
                        </td>

                        {/* Overall Status */}
                        <td style={{ padding: '0.95rem 1rem' }}>
                          <StatusBadge status={c.overallStatus} />
                          {c.isOverridden && (
                            <div style={{ fontSize: '0.72rem', color: '#6D28D9', fontWeight: 600, marginTop: '0.2rem' }}>
                              Admin Overridden
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.95rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              onClick={() => handleOpenDetails(c.applicationId)}
                              type="button"
                              title="View complete candidate dossier"
                              style={{
                                padding: '0.4rem 0.65rem',
                                borderRadius: '6px',
                                border: '1px solid #E2E8F0',
                                backgroundColor: '#FFFFFF',
                                color: '#475569',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>

                            {/* Move to Round 2 button for R1 Failed candidates */}
                            {isR1Failed && !c.isOverridden && (
                              <button
                                onClick={() => handleOpenApproval(c)}
                                type="button"
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  borderRadius: '6px',
                                  border: 'none',
                                  backgroundColor: '#4F46E5',
                                  color: '#FFFFFF',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                              >
                                <span>Move to Round 2</span>
                                <ArrowRight size={13} />
                              </button>
                            )}

                            {isR1Failed && c.isOverridden && (
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  color: '#6D28D9',
                                  backgroundColor: '#EDE9FE',
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: '6px',
                                }}
                              >
                                Round 2 Approved
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              color: '#64748B',
            }}
          >
            <div>
              Showing {candidates.length > 0 ? (currentPage - 1) * 10 + 1 : 0} to{' '}
              {Math.min(currentPage * 10, pagination.total)} of {pagination.total} candidates
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                type="button"
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage <= 1 ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronLeft size={15} />
              </button>

              <span style={{ padding: '0.35rem 0.65rem', fontWeight: 600 }}>
                Page {currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage >= pagination.totalPages || loading}
                type="button"
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  cursor: currentPage >= pagination.totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage >= pagination.totalPages ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
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
        onConfirm={handleConfirmApproval}
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
