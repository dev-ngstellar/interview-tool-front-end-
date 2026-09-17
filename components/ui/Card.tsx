import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function Card({
  title,
  subtitle,
  icon,
  children,
  className = '',
  style,
  ...props
}: CardProps) {
  return (
    <div
      className={`glass-card ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      {...props}
    >
      {(title || icon) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          {icon && (
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </div>
          )}
          <div>
            {title && (
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</h3>
            )}
            {subtitle && (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
