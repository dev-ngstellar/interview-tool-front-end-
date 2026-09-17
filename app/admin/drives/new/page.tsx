'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { driveService, CreateDrivePayload } from '@/services/api/driveService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  ArrowLeft,
  PlusCircle,
  AlertCircle,
  Calendar,
  Briefcase,
  Building,
  FileText,
} from 'lucide-react';

export default function CreateDrivePage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [position] = useState('Marketing Executive');
  const [description, setDescription] = useState('');
  const [collegeEligibility, setCollegeEligibility] = useState('');

  // Default dates: start today, end in 30 days
  const now = new Date();
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const [registrationStart, setRegistrationStart] = useState(now.toISOString().slice(0, 16));
  const [registrationEnd, setRegistrationEnd] = useState(in30Days.toISOString().slice(0, 16));
  const [status, setStatus] = useState<'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED'>('DRAFT');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Drive name is required.');
      return;
    }

    const startDate = new Date(registrationStart);
    const endDate = new Date(registrationEnd);

    if (endDate <= startDate) {
      setError('Registration end date must be after registration start date.');
      return;
    }

    try {
      setLoading(true);
      const payload: CreateDrivePayload = {
        name: name.trim(),
        position: 'Marketing Executive',
        description: description.trim() || undefined,
        collegeEligibility: collegeEligibility.trim() || undefined,
        registrationStart: startDate.toISOString(),
        registrationEnd: endDate.toISOString(),
        status,
      };

      await driveService.createDrive(payload);
      router.push('/admin/drives');
    } catch (err: any) {
      setError(err?.message || 'Failed to create recruitment drive.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return null;
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Navigation Breadcrumb / Header */}
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
              <span>Back to Drives</span>
            </Link>
          </div>
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: '#EEF2FF',
              color: '#4F46E5',
              border: '1px solid #E0E7FF',
              textTransform: 'uppercase',
            }}
          >
            Create Drive Flow
          </span>
        </div>

        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Create Recruitment Drive
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Set up a new campus drive specifically for hiring <strong>Marketing Executive</strong> candidates.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: '8px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#B91C1C',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={18} color="#DC2626" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Card */}
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
            <PlusCircle size={20} color="#4F46E5" />
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Drive Configuration</h2>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>
                Specify drive parameters, registration window, and target college criteria
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '0.45rem' }}>
                Recruitment Drive Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. National Campus Drive 2026 – Marketing Executives"
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
                    value={position}
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
                  Initial Drive Status
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
                  <option value="DRAFT">DRAFT (Hidden from candidates)</option>
                  <option value="OPEN">OPEN (Students can apply if dates valid)</option>
                  <option value="CLOSED">CLOSED (Closed for applications)</option>
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
                  placeholder="e.g. Open to graduating seniors across Commerce, Business & Arts disciplines"
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
                Description & Campus Drive Overview
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide context regarding the recruitment drive, company culture, role responsibilities..."
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
                disabled={loading}
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
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                }}
              >
                <PlusCircle size={16} />
                <span>{loading ? 'Creating...' : 'Create Drive'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
