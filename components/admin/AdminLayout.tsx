'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  activeNav?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== 'ADMIN')) {
      router.push('/admin');
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          color: '#64748B',
          gap: '0.75rem',
        }}
      >
        <Loader2 size={32} className="animate-spin" color="#4F46E5" />
        <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>Verifying administrative credentials...</span>
      </div>
    );
  }

  if (!user || role !== 'ADMIN') {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
      <AdminHeader />
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 64px)' }}>
        <AdminSidebar />
        <main
          style={{
            flex: 1,
            padding: '1.75rem 2rem',
            maxWidth: '1500px',
            width: '100%',
            overflowX: 'auto',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
