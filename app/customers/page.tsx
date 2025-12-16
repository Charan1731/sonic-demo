'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

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

export default function CustomersPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SonicConnectionResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadCustomers() {
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

        const data = (await res.json()) as SonicConnectionResponse;
        setResult(data);
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Unknown error while loading customers';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, [isLoaded, user]);

  const filteredCustomers = result?.customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  ) || [];

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
        <div style={{ color: '#000000' }}>Please sign in to view customers.</div>
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
        backgroundColor: '#ffffff',
        color: '#000000',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
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
            Customers
          </h1>
          <p style={{ fontSize: '1rem', color: '#000000' }}>
            Manage and view all your customers
          </p>
        </div>
        {result && (
          <div
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: '#ffffff',
              color: '#000000',
              border: '1px solid #000000',
              fontWeight: 600,
            }}
          >
            {result.total_customers} customers
          </div>
        )}
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
          Loading customers...
        </div>
      ) : result ? (
        <>
          {/* Search */}
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="Search customers by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '500px',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #000000',
                fontSize: '0.9rem',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            />
          </div>

          {/* Customers Grid */}
          {filteredCustomers.length === 0 ? (
            <div
              style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#000000',
                backgroundColor: '#ffffff',
                borderRadius: '0.9rem',
                border: '1px solid #000000',
              }}
            >
              {searchQuery
                ? 'No customers found matching your search.'
                : 'No customers found.'}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {filteredCustomers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/customers/${customer.id}`}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '0.9rem',
                    border: '1px solid #000000',
                    padding: '1.5rem',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.15s ease',
                    boxShadow: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#000000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#000000';
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
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '0.75rem',
                        backgroundColor: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        color: '#ffffff',
                        fontWeight: 600,
                      }}
                    >
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: '#000000',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {customer.name}
                  </h3>

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
                          fontSize: '0.875rem',
                          color: '#000000',
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
                          fontSize: '0.875rem',
                          color: '#000000',
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

                  <div
                    style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #000000',
                      fontSize: '0.875rem',
                      color: '#000000',
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
      ) : null}
    </div>
  );
}

