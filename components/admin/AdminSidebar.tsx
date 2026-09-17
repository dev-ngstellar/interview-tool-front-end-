import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart3,
  Briefcase,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      active: pathname === '/admin' || pathname === '/admin/dashboard',
    },
    {
      label: 'Candidates',
      href: '/admin/candidates',
      icon: Users,
      active: pathname.startsWith('/admin/candidates'),
    },
    {
      label: 'Assessments',
      href: '/admin/assessments',
      icon: ClipboardList,
      active: pathname.startsWith('/admin/assessments'),
    },
    {
      label: 'Reports',
      href: '/admin/reports',
      icon: BarChart3,
      active: pathname.startsWith('/admin/reports'),
    },
    {
      label: 'Recruitment Drives',
      href: '/admin/drives',
      icon: Briefcase,
      active: pathname.startsWith('/admin/drives'),
    },
  ];

  const renderSidebarContent = (isMobileView = false) => (
    <>
      <div>
        {/* Brand / Title Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.25rem 0.5rem 1.15rem',
            borderBottom: '1px solid #F1F5F9',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
                Admin Portal
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                Recruitment
              </div>
            </div>
          </div>

          {isMobileView && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                color: '#64748B',
                cursor: 'pointer',
              }}
              aria-label="Close navigation"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div
          style={{
            padding: '0 0.65rem 0.65rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#9CA3AF',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Navigation
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (isMobileView && onCloseMobile) {
                    onCloseMobile();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                  color: isActive ? '#4F46E5' : '#4B5563',
                  transition: 'all 0.15s ease',
                  border: isActive ? '1px solid #E0E7FF' : '1px solid transparent',
                }}
              >
                <Icon size={18} color={isActive ? '#4F46E5' : '#6B7280'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div style={{ paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
        <div
          style={{
            padding: '0.75rem 0.85rem',
            borderRadius: '8px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            marginBottom: '0.65rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <ShieldCheck size={15} color="#16A34A" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>
              Logged In as Admin
            </span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', wordBreak: 'break-all' }}>
            {user?.email || 'admin@example.test'}
          </div>
        </div>

        <button
          type="button"
          onClick={() => logout()}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.6rem 0.85rem',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#64748B',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FEE2E2';
            e.currentTarget.style.color = '#B91C1C';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#64748B';
          }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Fixed Stationary Sidebar */}
      <aside
        className="admin-desktop-sidebar admin-sidebar-scroll"
        style={{
          width: '240px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
          height: '100vh',
          maxHeight: '100vh',
          overflowY: 'auto',
          padding: '1.25rem 0.85rem',
        }}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* 2. Mobile Responsive Drawer & Backdrop */}
      {isMobileOpen && (
        <>
          <div
            className="admin-mobile-sidebar-backdrop"
            onClick={onCloseMobile}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(3px)',
              zIndex: 50,
            }}
          />
          <aside
            className="admin-mobile-sidebar-drawer admin-sidebar-scroll"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '260px',
              backgroundColor: '#FFFFFF',
              boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100vh',
              maxHeight: '100vh',
              overflowY: 'auto',
              padding: '1.25rem 0.85rem',
              zIndex: 60,
            }}
          >
            {renderSidebarContent(true)}
          </aside>
        </>
      )}
    </>
  );
};
