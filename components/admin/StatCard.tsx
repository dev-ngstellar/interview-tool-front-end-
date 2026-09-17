import React, { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon: ReactNode;
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  accentColor = '#4f46e5',
}) => {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        padding: '1.25rem 1.4rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: `${accentColor}12`,
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#111827', lineHeight: 1.15, marginBottom: '0.25rem' }}>
          {value}
        </div>
        {subtext && (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};
