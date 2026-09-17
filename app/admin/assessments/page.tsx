'use client';

import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ClipboardList, Clock, Award, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminAssessmentsPage() {
  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Recruitment Assessments Configuration
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Marketing Executive Drive 2-Stage Assessment Pipeline Specifications.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
          {/* Round 1 Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              padding: '1.75rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#4F46E5',
                    backgroundColor: '#EEF2FF',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                  }}
                >
                  ROUND 1
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803D', backgroundColor: '#DCFCE7', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                  ACTIVE
                </span>
              </div>

              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
                Quantitative & Logical Aptitude
              </h2>
              <p style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                Screening round assessing mathematical aptitude, data interpretation, pattern recognition, and logical problem-solving abilities.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748B', fontSize: '0.74rem', fontWeight: 600 }}>
                    <ClipboardList size={14} />
                    <span>QUESTION COUNT</span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                    15 Questions
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748B', fontSize: '0.74rem', fontWeight: 600 }}>
                    <Clock size={14} />
                    <span>DURATION</span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                    15 Minutes
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748B', fontSize: '0.74rem', fontWeight: 600 }}>
                    <Award size={14} />
                    <span>PASS BENCHMARK</span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                    80% (12/15)
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748B', fontSize: '0.74rem', fontWeight: 600 }}>
                    <CheckCircle2 size={14} />
                    <span>SCORING TYPE</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>
                    1.0 Mark / Q
                  </div>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Lock on Next • Forward-Only</span>
              <Link href="/admin/candidates?round1Status=FAILED" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4F46E5', textDecoration: 'none' }}>
                Review Failed Candidates →
              </Link>
            </div>
          </div>

          {/* Round 2 Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              padding: '1.75rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#6366F1',
                    backgroundColor: '#EEF2FF',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                  }}
                >
                  ROUND 2
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803D', backgroundColor: '#DCFCE7', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                  ACTIVE
                </span>
              </div>

              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
                English Vocabulary & Communication
              </h2>
              <p style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                Evaluates business vocabulary, sentence restructuring, verbal clarity, and situational communication skills required for Marketing Executives.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748B', fontSize: '0.74rem', fontWeight: 600 }}>
                    <ClipboardList size={14} />
                    <span>QUESTION COUNT</span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                    15 Questions
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748B', fontSize: '0.74rem', fontWeight: 600 }}>
                    <Clock size={14} />
                    <span>DURATION</span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                    20 Minutes
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748B', fontSize: '0.74rem', fontWeight: 600 }}>
                    <Award size={14} />
                    <span>PASS BENCHMARK</span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                    75% (Configurable)
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748B', fontSize: '0.74rem', fontWeight: 600 }}>
                    <CheckCircle2 size={14} />
                    <span>QUALIFICATION</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>
                    Final Hire Roster
                  </div>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Strict Forward Progression</span>
              <Link href="/admin/candidates?overallStatus=QUALIFIED" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4F46E5', textDecoration: 'none' }}>
                View Qualified Candidates →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
