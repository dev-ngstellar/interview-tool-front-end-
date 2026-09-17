'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminCandidateService, DashboardStatsData } from '@/services/api/adminCandidateService';
import { BarChart3, TrendingUp, Users, CheckCircle2, AlertTriangle, FileSpreadsheet, Loader2 } from 'lucide-react';

export default function AdminReportsPage() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await adminCandidateService.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load report metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const r1PassRate =
    stats && stats.round1Completed > 0
      ? Math.round((stats.round1Passed / stats.round1Completed) * 100)
      : 0;

  const totalRegistered = stats?.totalCandidates || 0;
  const totalQualified = stats?.qualified || 0;
  const overallConversion =
    totalRegistered > 0 ? ((totalQualified / totalRegistered) * 100).toFixed(1) : '0.0';

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Recruitment Drive Analytics & Reports
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Marketing Executive Drive Aggregated Pass/Fail Metrics and Funnel Conversion.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
            <Loader2 size={32} className="animate-spin" color="#4F46E5" style={{ margin: '0 auto 0.75rem' }} />
            <span>Calculating recruitment metrics...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Conversion Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Round 1 Aptitude Pass Rate
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
                  {r1PassRate}%
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                  {stats?.round1Passed} passed of {stats?.round1Completed} completed
                </p>
              </div>

              <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Overall Drive Conversion
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#15803D', marginBottom: '0.25rem' }}>
                  {overallConversion}%
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                  {totalQualified} qualified from {totalRegistered} registered candidates
                </p>
              </div>

              <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Round 1 Failure Rate
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#B91C1C', marginBottom: '0.25rem' }}>
                  {stats && stats.round1Completed > 0 ? 100 - r1PassRate : 0}%
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                  {stats?.round1Failed} candidates scored below 80%
                </p>
              </div>
            </div>

            {/* Assessment Stages Breakdown Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                padding: '1.5rem 1.75rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                Pipeline Stage Conversion
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>Round 1: Quantitative & Logical Aptitude</span>
                    <span style={{ color: '#64748B' }}>{stats?.round1Passed} Passed / {stats?.round1Completed} Attempted</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${r1PassRate}%`,
                        backgroundColor: '#4F46E5',
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>Round 2: English Vocabulary & Communication</span>
                    <span style={{ color: '#64748B' }}>
                      {stats?.qualified} Qualified / {stats?.pipeline?.round2?.eligible || 0} Eligible
                    </span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${
                          stats && stats.pipeline?.round2?.eligible && stats.pipeline.round2.eligible > 0
                            ? Math.round((stats.qualified / stats.pipeline.round2.eligible) * 100)
                            : 0
                        }%`,
                        backgroundColor: '#10B981',
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
