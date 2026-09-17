'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { driveService, RecruitmentDrive, UpdateDrivePayload } from '@/services/api/driveService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  ArrowLeft,
  Save,
  Play,
  Square,
  Archive,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Layers,
  Clock,
  Briefcase,
  Building,
  Loader2,
} from 'lucide-react';

export default function AdminDriveDetailsEditPage() {
  const params = useParams();
  const router = useRouter();
  const driveId = params.id as string;
  const { user, role, loading: authLoading } = useAuth();

  const [drive, setDrive] = useState<RecruitmentDrive | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [collegeEligibility, setCollegeEligibility] = useState('');
  const [registrationStart, setRegistrationStart] = useState('');
  const [registrationEnd, setRegistrationEnd] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED'>('DRAFT');

  const loadDrive = async () => {
    try {
      setLoading(true);
      const res = await driveService.getAdminDrive(driveId);
      if (res.data) {
        setDrive(res.data);
        setName(res.data.name || '');
        setDescription(res.data.description || '');
        setCollegeEligibility(res.data.collegeEligibility || '');
        setStatus((res.data.status as any) || 'DRAFT');

        if (res.data.registrationStart) {
          setRegistrationStart(new Date(res.data.registrationStart).toISOString().slice(0, 16));
        }
        if (res.data.registrationEnd) {
          setRegistrationEnd(new Date(res.data.registrationEnd).toISOString().slice(0, 16));
        }
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Could not load drive details.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (driveId && user && role === 'ADMIN') {
      loadDrive();
    } else {
      setLoading(false);
    }
  }, [driveId, user, role]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);

    const start = new Date(registrationStart);
    const end = new Date(registrationEnd);

    if (end <= start) {
      setActionMessage({ type: 'error', text: 'Registration end date must be after registration start date.' });
      return;
    }

    try {
      setSaving(true);
      const payload: UpdateDrivePayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        collegeEligibility: collegeEligibility.trim() || undefined,
        registrationStart: start.toISOString(),
        registrationEnd: end.toISOString(),
        status,
      };

      const res = await driveService.updateDrive(driveId, payload);
      setDrive(res.data);
      setActionMessage({ type: 'success', text: 'Recruitment drive successfully updated!' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to update drive.' });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: 'OPEN' | 'CLOSED' | 'ARCHIVED') => {
    try {
      setActionMessage(null);
      const res = await driveService.updateDriveStatus(driveId, newStatus);
      setStatus(newStatus);
      setActionMessage({ type: 'success', text: res.message || `Drive status changed to ${newStatus}.` });
      await loadDrive();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || `Failed to change status to ${newStatus}.` });
    }
  };

  if (authLoading || (user && loading)) {
    return (
      <AdminLayout>
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
          <Loader2 size={32} className="animate-spin" color="#4F46E5" style={{ margin: '0 auto 0.75rem' }} />
          <span>Loading drive configuration...</span>
        </div>
      </AdminLayout>
    );
  }

  if (!drive) {
    return (
      <AdminLayout>
        <div
          style={{
            maxWidth: '650px',
            margin: '3rem auto',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <AlertCircle size={36} color="#DC2626" style={{ margin: '0 auto 0.75rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
            Drive Not Found
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            The requested recruitment drive could not be located or does not exist.
          </p>
          <Link
            href="/admin/drives"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.15rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '0.86rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Drives</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  // Determine badge colors
  let statusBg = '#F1F5F9';
  let statusText = '#475569';
  let statusBorder = '#E2E8F0';

  if (status === 'OPEN') {
    statusBg = '#DCFCE7';
    statusText = '#15803D';
    statusBorder = '#BBF7D0';
  } else if (status === 'CLOSED') {
    statusBg = '#FEE2E2';
    statusText = '#B91C1C';
    statusBorder = '#FECACA';
  } else if (status === 'ARCHIVED') {
    statusBg = '#F8FAFC';
    statusText = '#94A3B8';
    statusBorder = '#E2E8F0';
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1050px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Breadcrumb & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              href="/admin/drives"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: '0.84rem',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
              }}
            >
              <ArrowLeft size={15} />
              <span>All Drives</span>
            </Link>
          </div>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: '#EEF2FF',
              color: '#4F46E5',
              border: '1px solid #E0E7FF',
              fontFamily: 'monospace',
            }}
          >
            DRIVE ID: {drive.id.slice(0, 8)}...
          </span>
        </div>

        {/* Page Title & Status Quick Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
              {drive.name}
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Marketing Executive Campus Drive Configuration & Lifecycle Management
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {status !== 'OPEN' && (
              <button
                type="button"
                onClick={() => handleStatusChange('OPEN')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '8px',
                  backgroundColor: '#DCFCE7',
                  color: '#15803D',
                  border: '1px solid #BBF7D0',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Play size={14} />
                <span>Open Registration</span>
              </button>
            )}

            {status === 'OPEN' && (
              <button
                type="button"
                onClick={() => handleStatusChange('CLOSED')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '8px',
                  backgroundColor: '#FEE2E2',
                  color: '#B91C1C',
                  border: '1px solid #FECACA',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Square size={14} />
                <span>Close Registration</span>
              </button>
            )}

            {status !== 'ARCHIVED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('ARCHIVED')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Archive size={14} />
                <span>Archive</span>
              </button>
            )}
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

        {/* Metrics Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              <Users size={16} color="#4F46E5" />
              <span>Total Candidates Applied</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>{drive.applicationCount || 0}</div>
          </div>

          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              <Layers size={16} color="#059669" />
              <span>Lifecycle Status</span>
            </div>
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.8rem',
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
              {status}
            </span>
          </div>

          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              <Calendar size={16} color="#D97706" />
              <span>Registration Phase</span>
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
              {drive.registrationPhase || 'ACTIVE'}
            </div>
          </div>
        </div>

        {/* Edit Form Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #F1F5F9' }}>
            <Save size={20} color="#4F46E5" />
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Edit Drive Configuration</h2>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>
                Update recruitment parameters and registration windows
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '0.45rem' }}>
                Drive Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '0.45rem' }}>
                  Position Role (Locked)
                </label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={16} color="#94A3B8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    disabled
                    value="Marketing Executive"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#F8FAFC',
                      color: '#64748B',
                      fontSize: '0.88rem',
                      cursor: 'not-allowed',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '0.45rem' }}>
                  Drive Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="OPEN">OPEN</option>
                  <option value="CLOSED">CLOSED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '0.45rem' }}>
                College & Eligibility Criteria
              </label>
              <div style={{ position: 'relative' }}>
                <Building size={16} color="#94A3B8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={collegeEligibility}
                  onChange={(e) => setCollegeEligibility(e.target.value)}
                  placeholder="e.g. Open to graduating seniors across all colleges"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '0.45rem' }}>
                Drive Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '0.88rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '0.45rem' }}>
                  Registration Start Date & Time *
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} color="#94A3B8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="datetime-local"
                    required
                    value={registrationStart}
                    onChange={(e) => setRegistrationStart(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '0.45rem' }}>
                  Registration End Date & Time *
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} color="#94A3B8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="datetime-local"
                    required
                    value={registrationEnd}
                    onChange={(e) => setRegistrationEnd(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
              <Link
                href="/admin/drives"
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.5rem',
                  borderRadius: '8px',
                  backgroundColor: '#4F46E5',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                }}
              >
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Associated Assessments */}
        {drive.assessments && drive.assessments.length > 0 && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              padding: '1.75rem 2rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.25rem 0' }}>
              Assessment Stages Setup
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 1.25rem 0' }}>
              Configured evaluation rounds for this drive
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {drive.assessments.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>{a.title}</div>
                    <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.2rem' }}>
                      Type: <strong>{a.type}</strong> • Duration: <strong>{a.durationMinutes} mins</strong> • Pass Requirement: <strong>{a.passPercentage || 80}%</strong>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      backgroundColor: '#DCFCE7',
                      color: '#15803D',
                      border: '1px solid #BBF7D0',
                    }}
                  >
                    Ready for Round Stage
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

