import React from 'react';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="student-light-theme"
      style={{
        minHeight: '100%',
        backgroundColor: '#F7F8FA',
        color: '#111827',
      }}
    >
      {children}
    </div>
  );
}
