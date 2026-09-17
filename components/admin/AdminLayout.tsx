'use client';

import React, { ReactNode, useEffect, useState } from 'react';
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || role !== 'ADMIN')) {
      router.push('/admin');
    }
  }, [user, role, loading, router]);

  // Prevent browser window / document body from creating double vertical scrollbars
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

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
    <div
      className="admin-layout-root"
      style={{
        height: '100vh',
        maxHeight: '100vh',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
        width: '100vw',
        maxWidth: '100vw',
      }}
    >
      {/* 1. Fixed Stationary Sidebar (stays visible while main area scrolls) */}
      <AdminSidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* 2. Main Area (Fixed Header + Scrollable Dashboard Content) */}
      <div
        className="admin-main-area"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Fixed Header/Navbar (stays stationary at top of main area) */}
        <AdminHeader onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)} />

        {/* Scrollable Dashboard Content (only this section scrolls vertically) */}
        <main
          className="admin-scrollable-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
            padding: '1.75rem 2rem',
            width: '100%',
          }}
        >
          <div style={{ maxWidth: '1500px', margin: '0 auto', width: '100%' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
