'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const isCandidateRoute = pathname === '/' || pathname?.startsWith('/student');

  return (
    <footer
      style={{
        borderTop: isCandidateRoute ? '1px solid #E5E7EB' : '1px solid var(--border-subtle)',
        backgroundColor: isCandidateRoute ? '#ffffff' : 'transparent',
        padding: '1.5rem 0',
        marginTop: 'auto',
        color: isCandidateRoute ? '#6b7280' : 'var(--text-muted)',
        fontSize: '0.85rem',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div>
          © 2026 Marketing Executive Drive • Campus Recruitment Assessment
        </div>
        <div style={{ fontSize: '0.82rem', color: isCandidateRoute ? '#6b7280' : 'var(--text-muted)' }}>
          Campus Recruitment Drive Portal
        </div>
      </div>
    </footer>
  );
}
