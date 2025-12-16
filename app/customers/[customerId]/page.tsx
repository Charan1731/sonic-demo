'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  email?: string | null;
  phone?: string | null;
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<SonicCustomer | null>(null);
  const [schedules, setSchedules] = useState<SonicSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomerData() {
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
        // Fetch all customers to find the one we need
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
          throw new Error(`Failed to fetch customers (status ${res.status})`);
        }

        const data = await res.json();
        const foundCustomer = data.customers.find(
          (c: SonicCustomer) => c.id === customerId,
        );

        if (!foundCustomer) {
          throw new Error('Customer not found');
        }

        setCustomer(foundCustomer);

        // Fetch schedules for this customer
        const schedulesRes = await fetch(
          `${SONIC_API_BASE}/api/integrations/api-keys/customers/${customerId}/schedules`,
          {
            headers: {
              'X-Sonic-Api-Key': apiKey,
              'X-User-Email': userEmail,
            },
          },
        );

        if (schedulesRes.ok) {
          const schedulesData = (await schedulesRes.json()) as SonicSchedule[];
          setSchedules(schedulesData);
        }
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Unknown error while loading customer data';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadCustomerData();
  }, [customerId, isLoaded, user]);

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
        <div style={{ color: '#6b7280' }}>Please sign in to view customer details.</div>
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
      {/* Back Button */}
      <Link
        href="/customers"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          color: '#6b7280',
          textDecoration: 'none',
          fontSize: '0.875rem',
        }}
      >
        ← Back to Customers
      </Link>

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
          Loading customer details...
        </div>
      ) : customer ? (
        <>
          {/* Customer Header */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.9rem',
              border: '1px solid #e5e7eb',
              padding: '2rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '1rem',
                  backgroundColor: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  color: '#ffffff',
                  fontWeight: 700,
                }}
              >
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h1
                  style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: '0.5rem',
                  }}
                >
                  {customer.name}
                </h1>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {customer.email && (
                    <div
                      style={{
                        fontSize: '1rem',
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <span>📧</span>
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div
                      style={{
                        fontSize: '1rem',
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <span>📞</span>
                      <span>{customer.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Schedules Section */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.9rem',
              border: '1px solid #e5e7eb',
              padding: '1.5rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#111827',
                marginBottom: '1rem',
              }}
            >
              Schedules ({schedules.length})
            </h2>

            {schedules.length === 0 ? (
              <div
                style={{
                  padding: '3rem',
                  textAlign: 'center',
                  color: '#9ca3af',
                }}
              >
                No schedules found for this customer.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '1rem',
                }}
              >
                {schedules.map((schedule) => (
                  <Link
                    key={schedule.schedule_id}
                    href={`/schedule/${schedule.schedule_id}`}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#f9fafb',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: '#111827',
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
                                : '#e5e7eb',
                          color:
                            schedule.status === 'active'
                              ? '#065f46'
                              : schedule.status === 'draft'
                                ? '#92400e'
                                : '#6b7280',
                        }}
                      >
                        {schedule.status || 'draft'}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginTop: '0.5rem',
                      }}
                    >
                      {schedule.start_date &&
                        new Date(schedule.start_date).toLocaleDateString()}
                      {schedule.end_date &&
                        ` - ${new Date(schedule.end_date).toLocaleDateString()}`}
                    </div>
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

