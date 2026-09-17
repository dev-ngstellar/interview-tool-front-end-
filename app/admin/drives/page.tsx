'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { driveService, RecruitmentDrive } from '@/services/api/driveService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  PlusCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  Archive,
  ArrowRight,
  Filter,
  RefreshCw,
  Users,
  Briefcase,
  Building,
  Calendar,
  Loader2,
} from 'lucide-react';

export default function AdminDrivesListPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [drives, setDrives] = useState<RecruitmentDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDrives = useCallback(async () => {
    try {
      setLoading(true);
      const res = await driveService.listAdminDrives({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setDrives(res.data || []);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to fetch recruitment drives.' });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    if (user && role === 'ADMIN') {
      fetchDrives();
    }
  }, [user, role, fetchDrives]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDrives();
  };

  const handleStatusChange = async (driveId: string, newStatus: 'OPEN' | 'CLOSED' | 'ARCHIVED') => {
    try {
      setActionMessage(null);
      const res = await driveService.updateDriveStatus(driveId, newStatus);
      setActionMessage({ type: 'success', text: res.message || `Drive status changed to ${newStatus}.` });
      await fetchDrives();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || `Failed to change status to ${newStatus}.` });
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Section 6: Header inside the shared admin content area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
              Recruitment Drives
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Create, configure, schedule, and manage recruitment drives for the Marketing Executive role.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => fetchDrives()}
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.6rem 1rem',
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

            {/* Section 15: Create New Drive top-right button */}
            <Link
              href="/admin/drives/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: '#4F46E5',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
              }}
            >
              <PlusCircle size={16} />
              <span>+ Create New Drive</span>
            </Link>
          </div>
        </div>

        {/* Action Message Alert */}
        {actionMessage && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: '8px',
              backgroundColor: actionMessage.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${actionMessage.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
              color: actionMessage.type === 'success' ? '#065F46' : '#B91C1C',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {actionMessage.type === 'success' ? <CheckCircle2 size={18} color="#059669" /> : <AlertCircle size={18} color="#DC2626" />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Section 7: Search and Filter Bar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '1.15rem 1.4rem',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.65rem', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by drive name, position, or college..."
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem 0.6rem 2.4rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#F8FAFC',
                  color: '#0F172A',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '0.6rem 1.15rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Search
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} color="#64748B" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="DRAFT">DRAFT</option>
              <option value="CLOSED">CLOSED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>

        {/* Section 8 & 9 & 10: Recruitment Drive Cards */}
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
            <Loader2 size={32} className="animate-spin" color="#4F46E5" style={{ margin: '0 auto 0.75rem' }} />
            <span>Loading recruitment drives...</span>
          </div>
        ) : drives.length === 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <Briefcase size={36} color="#94A3B8" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
              No Recruitment Drives Found
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0 0 1.25rem 0' }}>
              No drives matched your search or status filter. Create a new drive or reset your search.
            </p>
            <Link
              href="/admin/drives/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.2rem',
                borderRadius: '8px',
                backgroundColor: '#4F46E5',
                color: '#FFFFFF',
                fontSize: '0.86rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <PlusCircle size={15} />
              <span>Create Drive</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {drives.map((drive) => {
              // Section 9: Status badges light styling
              let statusBg = '#F1F5F9';
              let statusText = '#475569';
              let statusBorder = '#E2E8F0';

              if (drive.status === 'OPEN') {
                statusBg = '#DCFCE7';
                statusText = '#15803D';
                statusBorder = '#BBF7D0';
              } else if (drive.status === 'CLOSED') {
                statusBg = '#FEE2E2';
                statusText = '#B91C1C';
                statusBorder = '#FECACA';
              } else if (drive.status === 'ARCHIVED') {
                statusBg = '#F8FAFC';
                statusText = '#94A3B8';
                statusBorder = '#E2E8F0';
              } else if (drive.status === 'DRAFT') {
                statusBg = '#F1F5F9';
                statusText = '#475569';
                statusBorder = '#E2E8F0';
              }

              return (
                <div
                  key={drive.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    padding: '1.5rem 1.65rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.65rem',
                            borderRadius: '9999px',
                            backgroundColor: statusBg,
                            color: statusText,
                            border: `1px solid ${statusBorder}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {drive.status}
                        </span>

                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.65rem',
                            borderRadius: '9999px',
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          {drive.position}
                        </span>

                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.65rem',
                            borderRadius: '9999px',
                            backgroundColor: '#EEF2FF',
                            color: '#4F46E5',
                            border: '1px solid #E0E7FF',
                          }}
                        >
                          {drive.applicationCount || 0} Candidates Applied
                        </span>
                      </div>

                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.35rem 0' }}>
                        {drive.name}
                      </h2>
                    </div>

                    {/* Section 10: Drive Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link
                        href={`/admin/drives/${drive.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          color: '#334155',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <span>Edit / Manage</span>
                        <ArrowRight size={14} />
                      </Link>

                      {drive.status !== 'OPEN' && (
                        <button
                          onClick={() => handleStatusChange(drive.id, 'OPEN')}
                          type="button"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '6px',
                            border: '1px solid #BBF7D0',
                            backgroundColor: '#DCFCE7',
                            color: '#15803D',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <Play size={13} />
                          <span>Open Drive</span>
                        </button>
                      )}

                      {drive.status === 'OPEN' && (
                        <button
                          onClick={() => handleStatusChange(drive.id, 'CLOSED')}
                          type="button"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '6px',
                            border: '1px solid #FECACA',
                            backgroundColor: '#FEE2E2',
                            color: '#B91C1C',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <Square size={13} />
                          <span>Close Drive</span>
                        </button>
                      )}

                      {drive.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => handleStatusChange(drive.id, 'ARCHIVED')}
                          type="button"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#F8FAFC',
                            color: '#64748B',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Archive size={13} />
                          <span>Archive</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {drive.description && (
                    <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                      {drive.description}
                    </p>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '1.5rem',
                      fontSize: '0.8rem',
                      color: '#64748B',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #F1F5F9',
                    }}
                  >
                    {drive.collegeEligibility && (
                      <div>
                        <strong>Eligibility:</strong> {drive.collegeEligibility}
                      </div>
                    )}
                    <div>
                      <strong>Registration Window:</strong>{' '}
                      {new Date(drive.registrationStart).toLocaleDateString()} –{' '}
                      {new Date(drive.registrationEnd).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Created:</strong> {new Date(drive.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
