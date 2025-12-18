'use client';

import React, { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useDashboardState } from '@/components/DashboardState';
import { SonicWidget } from '@/src';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { loading, error, result, stats, loadDashboard } = useDashboardState();

  useEffect(() => {
    // Do not auto-connect; wait for user to click the Connect button
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <div
        style={{
          padding: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: '#000000' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          padding: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: '#000000' }}>Please sign in to view dashboard.</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#000000',
              marginBottom: '0.5rem',
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: '1rem', color: '#000000' }}>
            Connect to Sonic to load your organization and billing data.
          </p>
          {result && (
            <p style={{ fontSize: '0.9rem', color: '#000000', marginTop: '0.25rem' }}>
              Connection status:{' '}
              <span style={{ fontWeight: 600 }}>
                {result.connected ? 'Connected' : 'Not connected'} to {result.organization_name}
              </span>
            </p>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (!isLoaded || !user) return;
              const email = user.primaryEmailAddress?.emailAddress;
              if (!email) return;
              void loadDashboard(email);
            }}
            disabled={loading}
            style={{
              padding: '0.6rem 1.4rem',
              borderRadius: '999px',
              border: '1px solid #000000',
              backgroundColor: loading ? '#ffffff' : '#000000',
              color: loading ? '#000000' : '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Connecting…' : result ? 'Reconnect to Sonic' : 'Connect to Sonic'}
          </button>
          {user?.primaryEmailAddress?.emailAddress && process.env.NEXT_PUBLIC_SONIC_API_KEY && (
            <SonicWidget
              apiKey={process.env.NEXT_PUBLIC_SONIC_API_KEY}
              user={{ email: user.primaryEmailAddress.emailAddress }}
              env="development"
              buttonLabel="Open Sonic Seat Widget"
            />
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: '1px solid #000000',
            backgroundColor: '#ffffff',
            color: '#000000',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#000000',
          }}
        >
          Loading dashboard data...
        </div>
      ) : result ? (
        <>
          {/* Stats Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <StatCard
              title="Organization"
              value={result.organization_name}
              icon="🏢"
              color="#3b82f6"
            />
            <StatCard
              title="Total Customers"
              value={result.total_customers.toString()}
              icon="👥"
              color="#10b981"
            />
            <StatCard
              title="Total Schedules"
              value={stats.totalSchedules.toString()}
              icon="📅"
              color="#8b5cf6"
            />
            <StatCard
              title="Active Schedules"
              value={stats.activeSchedules.toString()}
              icon="✅"
              color="#06b6d4"
            />
            <StatCard
              title="Total Invoices"
              value={stats.totalInvoices.toString()}
              icon="📄"
              color="#f59e0b"
            />
            <StatCard
              title="Paid Invoices"
              value={stats.paidInvoices.toString()}
              icon="💰"
              color="#10b981"
            />
          </div>

          {/* Quick Actions */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.9rem',
              border: '1px solid #e5e7eb',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#111827',
                marginBottom: '1rem',
              }}
            >
              Quick Actions
            </h2>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/customers"
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#111827',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#111827';
                }}
              >
                View All Customers
              </Link>
              <Link
                href="/schedules"
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#111827',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#111827';
                }}
              >
                View All Schedules
              </Link>
            </div>
          </div>

          {/* Recent Customers Preview */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.9rem',
              border: '1px solid #e5e7eb',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                Recent Customers
              </h2>
              <Link
                href="/customers"
                style={{
                  fontSize: '0.875rem',
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                View all →
              </Link>
            </div>

            {result.customers.length === 0 ? (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#9ca3af',
                }}
              >
                No customers found.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1rem',
                }}
              >
                {result.customers.slice(0, 6).map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#f9fafb',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: '#111827',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {customer.name}
                    </div>
                    {customer.email && (
                      <div
                        style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                        }}
                      >
                        {customer.email}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.9rem',
        border: '1px solid #e5e7eb',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}
      >
        <span style={{ fontSize: '2rem' }}>{icon}</span>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '0.5rem',
            backgroundColor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: color,
            }}
          />
        </div>
      </div>
      <div
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '0.25rem',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '0.875rem',
          color: '#6b7280',
        }}
      >
        {title}
      </div>
    </div>
  );
}

