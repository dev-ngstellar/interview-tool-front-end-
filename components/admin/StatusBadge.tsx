import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const norm = (status || '').toUpperCase().trim();

  let bg = '#f1f5f9';
  let text = '#475569';
  let label = status || 'PENDING';
  let border = '#e2e8f0';

  if (norm === 'PASSED' || norm === 'APTITUDE_PASSED' || norm === 'COMMUNICATION_PASSED') {
    bg = '#dcfce7';
    text = '#15803d';
    border = '#bbf7d0';
    label = 'PASSED';
  } else if (norm === 'FAILED' || norm === 'APTITUDE_FAILED' || norm === 'COMMUNICATION_FAILED') {
    bg = '#fee2e2';
    text = '#b91c1c';
    border = '#fecaca';
    label = 'FAILED';
  } else if (norm === 'IN_PROGRESS' || norm === 'APTITUDE_IN_PROGRESS' || norm === 'COMMUNICATION_IN_PROGRESS') {
    bg = '#dbeafe';
    text = '#1d4ed8';
    border = '#bfdbfe';
    label = 'IN PROGRESS';
  } else if (norm === 'QUALIFIED') {
    bg = '#d1fae5';
    text = '#047857';
    border = '#a7f3d0';
    label = 'QUALIFIED';
  } else if (norm === 'ADMIN_APPROVED' || norm === 'ROUND 2 APPROVED') {
    bg = '#ede9fe';
    text = '#6d28d9';
    border = '#ddd6fe';
    label = 'ROUND 2 APPROVED';
  } else if (norm === 'ADMIN_REVIEW') {
    bg = '#fef3c7';
    text = '#b45309';
    border = '#fde68a';
    label = 'ADMIN REVIEW';
  } else if (norm === 'REGISTERED') {
    bg = '#f3f4f6';
    text = '#374151';
    border = '#e5e7eb';
    label = 'REGISTERED';
  } else if (norm === 'PENDING' || norm === 'APTITUDE_PENDING' || norm === 'COMMUNICATION_PENDING') {
    bg = '#f8fafc';
    text = '#64748b';
    border = '#e2e8f0';
    label = 'PENDING';
  } else if (norm === 'NOT_ELIGIBLE' || norm === '-') {
    bg = '#f8fafc';
    text = '#94a3b8';
    border = '#e2e8f0';
    label = '-';
  }

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: isSmall ? '0.2rem 0.6rem' : '0.35rem 0.85rem',
        borderRadius: '9999px',
        fontSize: isSmall ? '0.74rem' : '0.82rem',
        fontWeight: 700,
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {label}
    </span>
  );
};
