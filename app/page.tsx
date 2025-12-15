'use client';

import React, { useState } from 'react';

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

function Page() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SonicConnectionResponse | null>(null);

  async function handleConnect() {
    setError(null);
    setResult(null);

    const apiKey = SONIC_API_KEY;

    if (!apiKey) {
      setError(
        'Sonic API key is not configured. Set NEXT_PUBLIC_SONIC_API_KEY in the environment.',
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${SONIC_API_BASE}/api/integrations/api-keys/validate`,
        {
          headers: {
            'X-Sonic-Api-Key': apiKey,
          },
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
          text || `Failed to connect to Sonic (status ${res.status})`,
        );
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
            disabled={loading}
            style={{
              padding: '0.55rem 1.35rem',
              borderRadius: '999px',
              border: '1px solid #111827',
              backgroundColor: '#111827',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition:
                'background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease',
            }}
          >
            {loading ? 'Connecting…' : 'Connect to Sonic'}
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
          </section>
        )}
      </div>
    </main>
  );
}

export default Page;