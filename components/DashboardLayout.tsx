'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { DashboardProvider } from './DashboardState';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/customers', label: 'Customers', icon: '👥' },
    { href: '/seats', label: 'Seat Events', icon: '🪑' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: '240px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        {/* Logo/Brand */}
        <div
          style={{
            padding: '1.25rem 1.4rem 1.15rem',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '0.8rem',
                border: '1px solid #111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
              }}
            >
              S
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#6b7280',
                }}
              >
                Sonic
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                }}
              >
                Billing workspace
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: '0.9rem 0.8rem 0.9rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '999px',
                  backgroundColor: active ? '#111827' : 'transparent',
                  color: active ? '#ffffff' : '#6b7280',
                  fontWeight: active ? 600 : 500,
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                  transition: 'background-color 0.16s ease, color 0.16s ease',
                }}
              >
                <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div
          style={{
            padding: '0.85rem 1rem 1.1rem',
            borderTop: '1px solid #f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserButton />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <DashboardProvider>
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
          }}
        >
          {children}
        </main>
      </DashboardProvider>
    </div>
  );
}

