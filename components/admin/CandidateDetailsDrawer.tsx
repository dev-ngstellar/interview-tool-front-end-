import React, { useState, useEffect } from 'react';
import { X, User, GraduationCap, Building2, Calendar, Mail, Phone, ArrowRight, CheckCircle2, History, AlertTriangle, ShieldCheck, Loader2, IdCard } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { adminCandidateService, CandidateDetailsData } from '@/services/api/adminCandidateService';

interface CandidateDetailsDrawerProps {
  applicationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onMoveToRound2: (candidate: any) => void;
}

export const CandidateDetailsDrawer: React.FC<CandidateDetailsDrawerProps> = ({
  applicationId,
  isOpen,
  onClose,
  onMoveToRound2,
}) => {
  const [details, setDetails] = useState<CandidateDetailsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !applicationId) {
      setDetails(null);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await adminCandidateService.getCandidateDetails(applicationId);
        setDetails(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load candidate details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, applicationId]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(2px)',
        zIndex: 90,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: '#FFFFFF',
          height: '100%',
          boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideLeft 0.25s ease',
          overflowY: 'auto',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
              Candidate Assessment Dossier
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
              Application ID: <span style={{ fontFamily: 'monospace' }}>{applicationId}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ padding: '1.5rem', flex: 1 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748B' }}>
              <Loader2 size={32} className="animate-spin" color="#4F46E5" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Loading candidate history...</p>
            </div>
          )}

          {error && (
            <div style={{ padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#B91C1C' }}>
              {error}
            </div>
          )}

          {details && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Candidate Info Card */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: '#EEF2FF',
                        color: '#4F46E5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.15rem',
                      }}
                    >
                      {details.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                        {details.name}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#4F46E5',
                            backgroundColor: '#EEF2FF',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '5px',
                            border: '1px solid #C7D2FE',
                          }}
                        >
                          Student ID: {details.studentId || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <StatusBadge status={details.overallStatus} size="md" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#334155' }}>
                    <IdCard size={15} color="#64748B" />
                    <span><strong>Student ID:</strong> {details.studentId || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#334155' }}>
                    <Mail size={15} color="#64748B" />
                    <span>{details.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#334155' }}>
                    <Phone size={15} color="#64748B" />
                    <span>{details.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#334155' }}>
                    <Calendar size={15} color="#64748B" />
                    <span>Registered: {new Date(details.registrationDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Assessment Performance Section */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Recruitment Assessment Breakdown
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Round 1 Card */}
                  <div
                    style={{
                      padding: '1.1rem',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase' }}>
                        Round 1 Aptitude
                      </span>
                      <StatusBadge status={details.round1.status} />
                    </div>

                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.2rem' }}>
                      {details.round1.score !== null ? `${details.round1.score} / ${details.round1.total || 15}` : '-'}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '0.65rem' }}>
                      Percentage:{' '}
                      <strong style={{ color: details.round1.percentage !== null && details.round1.percentage >= 80 ? '#15803D' : '#B91C1C' }}>
                        {details.round1.percentage !== null ? `${details.round1.percentage}%` : '-'}
                      </strong>{' '}
                      (Pass: 80%)
                    </div>

                    <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                      {details.round1.completedAt
                        ? `Completed: ${new Date(details.round1.completedAt).toLocaleDateString()}`
                        : details.round1.startedAt
                        ? `Started: ${new Date(details.round1.startedAt).toLocaleDateString()}`
                        : 'Not yet attempted'}
                    </div>

                    {/* Admin Override Action if Failed */}
                    {details.round1.status === 'FAILED' && !details.isOverridden && (
                      <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
                        <button
                          onClick={() => onMoveToRound2(details)}
                          type="button"
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.75rem',
                            borderRadius: '6px',
                            backgroundColor: '#4F46E5',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span>Move to Round 2</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Round 2 Card */}
                  <div
                    style={{
                      padding: '1.1rem',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase' }}>
                        Round 2 Communication
                      </span>
                      <StatusBadge status={details.round2.status} />
                    </div>

                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.2rem' }}>
                      {details.round2.score !== null ? `${details.round2.score} / ${details.round2.total || 15}` : '-'}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '0.65rem' }}>
                      Percentage:{' '}
                      <strong style={{ color: details.round2.percentage !== null && details.round2.percentage >= 75 ? '#15803D' : '#B91C1C' }}>
                        {details.round2.percentage !== null ? `${details.round2.percentage}%` : '-'}
                      </strong>{' '}
                      (Pass: 75%)
                    </div>

                    <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                      {details.round2.completedAt
                        ? `Completed: ${new Date(details.round2.completedAt).toLocaleDateString()}`
                        : details.round2.startedAt
                        ? `Started: ${new Date(details.round2.startedAt).toLocaleDateString()}`
                        : details.isOverridden
                        ? 'Round 2 Approved by Admin'
                        : 'Awaiting Round 1 qualification'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Activity & Assessment Environment Violations */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <ShieldCheck size={17} color="#4F46E5" />
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: '#0F172A',
                      }}
                    >
                      Security Activity & Environment Violations
                    </h4>
                  </div>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      background:
                        details.securityActivity?.securityStatus === 'Flagged'
                          ? '#FEE2E2'
                          : details.securityActivity?.securityStatus === 'Warning'
                          ? '#FEF3C7'
                          : '#F0FDF4',
                      color:
                        details.securityActivity?.securityStatus === 'Flagged'
                          ? '#B91C1C'
                          : details.securityActivity?.securityStatus === 'Warning'
                          ? '#B45309'
                          : '#15803D',
                    }}
                  >
                    Security Status: {details.securityActivity?.securityStatus || 'Normal'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.65rem',
                    marginBottom: '0.85rem',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      padding: '0.6rem',
                      borderRadius: '8px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                      TAB SWITCH
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.15rem' }}>
                      {details.securityActivity?.breakdown?.TAB_SWITCH || 0}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '0.6rem',
                      borderRadius: '8px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                      FULLSCREEN EXIT
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.15rem' }}>
                      {details.securityActivity?.breakdown?.FULLSCREEN_EXIT || 0}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '0.6rem',
                      borderRadius: '8px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                      WINDOW BLUR
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.15rem' }}>
                      {details.securityActivity?.breakdown?.WINDOW_BLUR || 0}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.76rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    Security Events: <strong>{details.securityActivity?.totalEvents || 0}</strong>
                  </span>
                  <span>
                    Violations: <strong>{details.securityActivity?.violationsCount || 0} / 3</strong>
                  </span>
                </div>
              </div>

              {/* Administrative Override Audit Record */}
              {details.adminApproval && (
                <div
                  style={{
                    padding: '1rem 1.15rem',
                    borderRadius: '10px',
                    border: '1px solid #DDD6FE',
                    background: '#F5F3FF',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#6D28D9', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    <ShieldCheck size={16} />
                    <span>Administrative Round 2 Waiver Audited</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#374151', lineHeight: 1.45, marginBottom: '0.35rem' }}>
                    <strong>Reason:</strong> {details.adminApproval.reason}
                  </div>
                  {details.adminApproval.remarks && (
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.35rem' }}>
                      <strong>Remarks:</strong> {details.adminApproval.remarks}
                    </div>
                  )}
                  <div style={{ fontSize: '0.74rem', color: '#7C3AED' }}>
                    Approved by {details.adminApproval.adminEmail} on {new Date(details.adminApproval.approvedAt).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Timeline / Audit Logs */}
              {details.auditLogs && details.auditLogs.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 0.65rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Audit History Trail
                  </h4>
                  <div style={{ borderLeft: '2px solid #E2E8F0', marginLeft: '0.5rem', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {details.auditLogs.slice(0, 5).map((log) => (
                      <div key={log.id} style={{ fontSize: '0.78rem' }}>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{log.action}</span>
                        <div style={{ color: '#94A3B8' }}>{new Date(log.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #E5E7EB',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            type="button"
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
