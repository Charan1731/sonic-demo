'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

const SONIC_API_BASE =
  process.env.NEXT_PUBLIC_SONIC_API_BASE ?? 'http://localhost:8000';
const SONIC_API_KEY = process.env.NEXT_PUBLIC_SONIC_API_KEY ?? '';

type SonicSchedule = {
  schedule_id: string;
  billing_schedule_label?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  duration?: string | null;
  billing_day?: string | null;
  currency_code?: string | null;
  customer_name?: string | null;
  contract_name?: string | null;
  created_at?: string | null;
};

type SonicCustomer = {
  id: string;
  name: string;
};

export default function SchedulesPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<SonicSchedule[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function loadSchedules() {
      if (!isLoaded || !user) {
        return;
      }

      const userEmail = user.primaryEmailAddress?.emailAddress;
      if (!userEmail) {
        setError('Unable to get your email address.');
        setLoading(false);
        return;
      }

      const apiKey = SONIC_API_KEY;
      if (!apiKey) {
        setError('Sonic API key is not configured.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch all customers
        const res = await fetch(
          `${SONIC_API_BASE}/api/integrations/api-keys/validate`,
          {
            headers: {
              'X-Sonic-Api-Key': apiKey,
              'X-User-Email': userEmail,
            },
          },
        );

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          let errorMessage =
            text || `Failed to connect to Sonic (status ${res.status})`;

          try {
            const errorJson = JSON.parse(text);
            errorMessage = errorJson.detail || errorMessage;
          } catch {
            // Not JSON, use text as is
          }

          throw new Error(errorMessage);
        }

        const data = await res.json();
        const customers = data.customers as SonicCustomer[];

        // Fetch schedules for all customers
        const allSchedules: SonicSchedule[] = [];
        for (const customer of customers) {
          try {
            const schedulesRes = await fetch(
              `${SONIC_API_BASE}/api/integrations/api-keys/customers/${customer.id}/schedules`,
              {
                headers: {
                  'X-Sonic-Api-Key': apiKey,
                  'X-User-Email': userEmail,
                },
              },
            );

            if (schedulesRes.ok) {
              const customerSchedules = (await schedulesRes.json()) as SonicSchedule[];
              allSchedules.push(...customerSchedules);
            }
          } catch {
            // Skip if schedule fetch fails
          }
        }

        setSchedules(allSchedules);
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Unknown error while loading schedules';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadSchedules();
  }, [isLoaded, user]);

  const filteredSchedules =
    statusFilter === 'all'
      ? schedules
      : schedules.filter((s) => s.status === statusFilter);

  const statusCounts = {
    all: schedules.length,
    active: schedules.filter((s) => s.status === 'active').length,
    draft: schedules.filter((s) => s.status === 'draft').length,
    completed: schedules.filter((s) => s.status === 'completed').length,
  };

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
        <div style={{ color: '#6b7280' }}>Loading...</div>
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
        <div style={{ color: '#6b7280' }}>Please sign in to view schedules.</div>
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
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '0.5rem',
          }}
        >
          Schedules
        </h1>
        <p style={{ fontSize: '1rem', color: '#6b7280' }}>
          View and manage all billing schedules
        </p>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
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
            color: '#6b7280',
          }}
        >
          Loading schedules...
        </div>
      ) : (
        <>
          {/* Status Filters */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
            }}
          >
            {(['all', 'active', 'draft', 'completed'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb',
                  backgroundColor:
                    statusFilter === status ? '#111827' : '#ffffff',
                  color: statusFilter === status ? '#ffffff' : '#111827',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textTransform: 'capitalize',
                }}
                onMouseEnter={(e) => {
                  if (statusFilter !== status) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (statusFilter !== status) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }
                }}
              >
                {status} ({statusCounts[status]})
              </button>
            ))}
          </div>

          {/* Schedules Grid */}
          {filteredSchedules.length === 0 ? (
            <div
              style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#9ca3af',
                backgroundColor: '#ffffff',
                borderRadius: '0.9rem',
                border: '1px solid #e5e7eb',
              }}
            >
              No schedules found.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {filteredSchedules.map((schedule) => (
                <Link
                  key={schedule.schedule_id}
                  href={`/schedule/${schedule.schedule_id}`}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '0.9rem',
                    border: '1px solid #e5e7eb',
                    padding: '1.5rem',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow =
                      '0 4px 12px rgba(59, 130, 246, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#111827',
                        flex: 1,
                      }}
                    >
                      {schedule.billing_schedule_label ||
                        schedule.contract_name ||
                        'Unnamed Schedule'}
                    </h3>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor:
                          schedule.status === 'active'
                            ? '#d1fae5'
                            : schedule.status === 'draft'
                              ? '#fef3c7'
                              : schedule.status === 'completed'
                                ? '#e0e7ff'
                                : '#e5e7eb',
                        color:
                          schedule.status === 'active'
                            ? '#065f46'
                            : schedule.status === 'draft'
                              ? '#92400e'
                              : schedule.status === 'completed'
                                ? '#3730a3'
                                : '#6b7280',
                      }}
                    >
                      {schedule.status || 'draft'}
                    </span>
                  </div>

                  {schedule.customer_name && (
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Customer: {schedule.customer_name}
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {schedule.start_date &&
                      new Date(schedule.start_date).toLocaleDateString()}
                    {schedule.end_date &&
                      ` - ${new Date(schedule.end_date).toLocaleDateString()}`}
                  </div>

                  {schedule.duration && (
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Duration: {schedule.duration}
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #e5e7eb',
                      fontSize: '0.875rem',
                      color: '#3b82f6',
                      fontWeight: 500,
                    }}
                  >
                    View details →
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

