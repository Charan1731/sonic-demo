'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';

const SONIC_API_BASE =
  process.env.NEXT_PUBLIC_SONIC_API_BASE ?? 'http://localhost:8000';
const SONIC_API_KEY = process.env.NEXT_PUBLIC_SONIC_API_KEY ?? '';

type SonicCustomer = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

type SonicConnectionResponse = {
  connected: boolean;
  organization_id: string;
  organization_name: string;
  total_customers: number;
  customers: SonicCustomer[];
};

type SonicSchedule = {
  schedule_id: string;
  contract_id?: string | null;
  contract_name?: string | null;
  customer_name?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  billing_frequency?: string | null;
  currency_code?: string | null;
  created_at?: string | null;
};

function Page() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SonicConnectionResponse | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<SonicSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  async function handleConnect() {
    setError(null);
    setResult(null);

    if (!isLoaded) {
      setError('Please wait while we verify your authentication...');
      return;
    }

    if (!user) {
      setError('Please sign in to connect to Sonic.');
      return;
    }

    const apiKey = SONIC_API_KEY;
    const userEmail = user.primaryEmailAddress?.emailAddress;

    if (!apiKey) {
      setError(
        'Sonic API key is not configured. Set NEXT_PUBLIC_SONIC_API_KEY in the environment.',
      );
      return;
    }

    if (!userEmail) {
      setError('Unable to get your email address. Please ensure your Clerk account has a verified email.');
      return;
    }

    setLoading(true);
    try {
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
        let errorMessage = text || `Failed to connect to Sonic (status ${res.status})`;
        
        // Try to parse JSON error response
        try {
          const errorJson = JSON.parse(text);
          errorMessage = errorJson.detail || errorMessage;
        } catch {
          // Not JSON, use text as is
        }
        
        throw new Error(errorMessage);
      }

      const data = (await res.json()) as SonicConnectionResponse;
      setResult(data);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Unknown error while connecting to Sonic';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCustomerClick(customerId: string) {
    if (!user || !isLoaded) {
      setSchedulesError('Please sign in to view schedules.');
      return;
    }

    const apiKey = SONIC_API_KEY;
    const userEmail = user.primaryEmailAddress?.emailAddress;

    if (!apiKey || !userEmail) {
      setSchedulesError('API key or user email not available.');
      return;
    }

    setSelectedCustomer(customerId);
    setSchedulesLoading(true);
    setSchedulesError(null);
    setSchedules([]);

    try {
      const res = await fetch(
        `${SONIC_API_BASE}/api/integrations/api-keys/customers/${customerId}/schedules`,
        {
          headers: {
            'X-Sonic-Api-Key': apiKey,
            'X-User-Email': userEmail,
          },
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let errorMessage = text || `Failed to fetch schedules (status ${res.status})`;
        
        try {
          const errorJson = JSON.parse(text);
          errorMessage = errorJson.detail || errorMessage;
        } catch {
          // Not JSON, use text as is
        }
        
        throw new Error(errorMessage);
      }

      const data = (await res.json()) as SonicSchedule[];
      setSchedules(data);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Unknown error while fetching schedules';
      setSchedulesError(message);
    } finally {
      setSchedulesLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        color: '#111827',
        padding: '2.5rem',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          backgroundColor: '#ffffff',
          borderRadius: '0.9rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
          padding: '1.75rem',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.75rem',
            gap: '1.25rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              Connect to Sonic
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Use your Sonic API key to fetch the organization and its customers.
            </p>
          </div>
          <button
            type="button"
            onClick={handleConnect}
            disabled={loading || !isLoaded || !user}
            style={{
              padding: '0.55rem 1.35rem',
              borderRadius: '999px',
              border: '1px solid #111827',
              backgroundColor: '#111827',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: loading || !isLoaded || !user ? 'default' : 'pointer',
              opacity: loading || !isLoaded || !user ? 0.5 : 1,
              transition:
                'background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease',
            }}
          >
            {loading
              ? 'Connecting…'
              : !isLoaded
                ? 'Loading…'
                : !user
                  ? 'Sign in required'
                  : 'Connect to Sonic'}
          </button>
        </header>

        {error && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 0.95rem',
              borderRadius: '0.75rem',
              border: '1px solid #fecaca',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <section style={{ marginTop: '0.75rem' }}>
            <div
              style={{
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#9ca3af',
                    marginBottom: '0.25rem',
                  }}
                >
                  Connection Status
                </p>
                <p
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: 500,
                    color: '#111827',
                  }}
                >
                  {result.connected ? 'Connected' : 'Not connected'} to{' '}
                  <span style={{ color: '#111827' }}>
                    {result.organization_name}
                  </span>
                </p>
              </div>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: '#6b7280',
                }}
              >
                {result.total_customers} customers
              </span>
            </div>

            <div
              style={{
                borderRadius: '0.85rem',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                backgroundColor: '#f9fafb',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem',
                }}
              >
                <thead
                  style={{
                    backgroundColor: '#f3f4f6',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.6rem 0.9rem',
                        color: '#6b7280',
                        fontWeight: 500,
                      }}
                    >
                      Customer
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.6rem 0.9rem',
                        color: '#6b7280',
                        fontWeight: 500,
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.6rem 0.9rem',
                        color: '#6b7280',
                        fontWeight: 500,
                      }}
                    >
                      Phone
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.customers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          padding: '0.9rem',
                          color: '#9ca3af',
                        }}
                      >
                        No customers found for this organization.
                      </td>
                    </tr>
                  ) : (
                    result.customers.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => handleCustomerClick(c.id)}
                        style={{
                          borderTop: '1px solid #e5e7eb',
                          backgroundColor:
                            selectedCustomer === c.id ? '#f3f4f6' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedCustomer !== c.id) {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedCustomer !== c.id) {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                          }
                        }}
                      >
                        <td
                          style={{
                            padding: '0.65rem 0.9rem',
                            color: '#111827',
                            fontWeight: selectedCustomer === c.id ? 500 : 400,
                          }}
                        >
                          {c.name}
                        </td>
                        <td
                          style={{
                            padding: '0.65rem 0.9rem',
                            color: '#6b7280',
                          }}
                        >
                          {c.email || '—'}
                        </td>
                        <td
                          style={{
                            padding: '0.65rem 0.9rem',
                            color: '#6b7280',
                          }}
                        >
                          {c.phone || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {selectedCustomer && (
              <div
                style={{
                  marginTop: '1.5rem',
                  borderRadius: '0.85rem',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  padding: '1.25rem',
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
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#111827',
                    }}
                  >
                    Schedules
                    {result &&
                      result.customers.find((c) => c.id === selectedCustomer) && (
                        <span style={{ color: '#6b7280', fontWeight: 400 }}>
                          {' '}
                          for{' '}
                          {
                            result.customers.find((c) => c.id === selectedCustomer)
                              ?.name
                          }
                        </span>
                      )}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setSchedules([]);
                      setSchedulesError(null);
                    }}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#ffffff',
                      color: '#6b7280',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    Close
                  </button>
                </div>

                {schedulesError && (
                  <div
                    style={{
                      marginBottom: '1rem',
                      padding: '0.75rem 0.95rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #fecaca',
                      backgroundColor: '#fef2f2',
                      color: '#b91c1c',
                      fontSize: '0.85rem',
                    }}
                  >
                    {schedulesError}
                  </div>
                )}

                {schedulesLoading ? (
                  <div
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '0.9rem',
                    }}
                  >
                    Loading schedules…
                  </div>
                ) : schedules.length === 0 ? (
                  <div
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: '#9ca3af',
                      fontSize: '0.9rem',
                    }}
                  >
                    No schedules found for this customer.
                  </div>
                ) : (
                  <div
                    style={{
                      borderRadius: '0.75rem',
                      border: '1px solid #e5e7eb',
                      overflow: 'hidden',
                      backgroundColor: '#f9fafb',
                    }}
                  >
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.875rem',
                      }}
                    >
                      <thead
                        style={{
                          backgroundColor: '#f3f4f6',
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        <tr>
                          <th
                            style={{
                              textAlign: 'left',
                              padding: '0.6rem 0.9rem',
                              color: '#6b7280',
                              fontWeight: 500,
                            }}
                          >
                            Contract
                          </th>
                          <th
                            style={{
                              textAlign: 'left',
                              padding: '0.6rem 0.9rem',
                              color: '#6b7280',
                              fontWeight: 500,
                            }}
                          >
                            Status
                          </th>
                          <th
                            style={{
                              textAlign: 'left',
                              padding: '0.6rem 0.9rem',
                              color: '#6b7280',
                              fontWeight: 500,
                            }}
                          >
                            Start Date
                          </th>
                          <th
                            style={{
                              textAlign: 'left',
                              padding: '0.6rem 0.9rem',
                              color: '#6b7280',
                              fontWeight: 500,
                            }}
                          >
                            End Date
                          </th>
                          <th
                            style={{
                              textAlign: 'left',
                              padding: '0.6rem 0.9rem',
                              color: '#6b7280',
                              fontWeight: 500,
                            }}
                          >
                            Frequency
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map((s) => (
                          <tr
                            key={s.schedule_id}
                            style={{
                              borderTop: '1px solid #e5e7eb',
                              backgroundColor: '#ffffff',
                            }}
                          >
                            <td
                              style={{
                                padding: '0.65rem 0.9rem',
                                color: '#111827',
                              }}
                            >
                              {s.contract_name || '—'}
                            </td>
                            <td
                              style={{
                                padding: '0.65rem 0.9rem',
                              }}
                            >
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  backgroundColor:
                                    s.status === 'active'
                                      ? '#d1fae5'
                                      : s.status === 'draft'
                                        ? '#fef3c7'
                                        : '#e5e7eb',
                                  color:
                                    s.status === 'active'
                                      ? '#065f46'
                                      : s.status === 'draft'
                                        ? '#92400e'
                                        : '#6b7280',
                                }}
                              >
                                {s.status || 'draft'}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: '0.65rem 0.9rem',
                                color: '#6b7280',
                              }}
                            >
                              {s.start_date
                                ? new Date(s.start_date).toLocaleDateString()
                                : '—'}
                            </td>
                            <td
                              style={{
                                padding: '0.65rem 0.9rem',
                                color: '#6b7280',
                              }}
                            >
                              {s.end_date
                                ? new Date(s.end_date).toLocaleDateString()
                                : '—'}
                            </td>
                            <td
                              style={{
                                padding: '0.65rem 0.9rem',
                                color: '#6b7280',
                              }}
                            >
                              {s.billing_frequency || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default Page;