'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  fetchScheduleDetails,
  fetchScheduleInvoices,
  type ScheduleDetails,
  type Invoice,
} from '@/lib/api';

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const scheduleId = params.scheduleId as string;

  const [schedule, setSchedule] = useState<ScheduleDetails | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openPhase, setOpenPhase] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!isLoaded || !user) {
        return;
      }

      const userEmail = user.primaryEmailAddress?.emailAddress;
      if (!userEmail) {
        setError('Unable to get your email address.');
        setLoading(false);
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const [scheduleData, invoicesData] = await Promise.all([
          fetchScheduleDetails(scheduleId, userEmail),
          fetchScheduleInvoices(scheduleId, userEmail),
        ]);

        setSchedule(scheduleData);
        setInvoices(invoicesData);
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Unknown error while loading schedule details';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [scheduleId, isLoaded, user]);

  if (!isLoaded) {
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
        }}
      >
        <div>Loading...</div>
      </main>
    );
  }

  if (!user) {
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
        }}
      >
        <div>Please sign in to view schedule details.</div>
      </main>
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
      {/* Back Button */}
      <button
        type="button"
        onClick={() => router.back()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: '1px solid #000000',
          backgroundColor: '#ffffff',
          color: '#000000',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f5f5f5';
          e.currentTarget.style.borderColor = '#000000';
          e.currentTarget.style.color = '#000000';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffffff';
          e.currentTarget.style.borderColor = '#000000';
          e.currentTarget.style.color = '#000000';
        }}
      >
        ← Back
      </button>

        {error && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 0.95rem',
              borderRadius: '0.75rem',
              border: '1px solid #000000',
              backgroundColor: '#ffffff',
              color: '#000000',
              fontSize: '0.85rem',
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
            Loading schedule details...
          </div>
        ) : schedule ? (
          <>
            {/* Schedule Header */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.9rem',
                border: '1px solid #000000',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: 'none',
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
                <div>
                  <h1
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: '#000000',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {schedule.billing_schedule_label ||
                      schedule.contract_name ||
                      'Unnamed Schedule'}
                  </h1>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: '#000000',
                    color: '#ffffff',
                  }}
                >
                  {schedule.status || 'draft'}
                </span>
                    {schedule.customer_name && (
                      <span style={{ fontSize: '0.875rem', color: '#000000' }}>
                        Customer: {schedule.customer_name}
                      </span>
                    )}
                    {schedule.currency_code && (
                      <span style={{ fontSize: '0.875rem', color: '#000000' }}>
                        Currency: {schedule.currency_code}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginTop: '1rem',
                }}
              >
                {schedule.start_date && (
                  <div>
                    <p
                      style={{
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                    color: '#000000',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Start Date
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#111827' }}>
                      {new Date(schedule.start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {schedule.end_date && (
                  <div>
                    <p
                      style={{
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                    color: '#000000',
                        marginBottom: '0.25rem',
                      }}
                    >
                      End Date
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#111827' }}>
                      {new Date(schedule.end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {schedule.duration && (
                  <div>
                    <p
                      style={{
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                    color: '#000000',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Duration
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#111827' }}>
                      {schedule.duration}
                    </p>
                  </div>
                )}
                {schedule.billing_day && (
                  <div>
                    <p
                      style={{
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                    color: '#000000',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Billing Day
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#111827' }}>
                      {(() => {
                        const day = parseInt(schedule.billing_day || '0', 10);
                        if (isNaN(day)) return schedule.billing_day;
                        const suffix =
                          day === 1 || day === 21 || day === 31
                            ? 'st'
                            : day === 2 || day === 22
                              ? 'nd'
                              : day === 3 || day === 23
                                ? 'rd'
                                : 'th';
                        return `${day}${suffix}`;
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Phases Section */}
            {schedule.phases && schedule.phases.length > 0 && (
              <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.9rem',
                border: '1px solid #000000',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: 'none',
              }}
              >
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    marginBottom: '1rem',
                  }}
                >
                  Phases ({schedule.phases.length})
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {schedule.phases.map((phase) => {
                    const isOpen = openPhase === phase.phase_number;
                    return (
                      <div
                        key={phase.phase_number}
                        style={{
                          border: '1px solid #000000',
                          borderRadius: '0.75rem',
                          backgroundColor: '#ffffff',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenPhase(isOpen ? null : phase.phase_number)
                          }
                          style={{
                            width: '100%',
                            padding: '0.9rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              gap: '0.1rem',
                            }}
                          >
                            <div
                              style={{
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              color: '#000000',
                              }}
                            >
                              Phase {phase.phase_number}
                              {phase.name && `: ${phase.name}`}
                            </div>
                            <div
                              style={{
                                fontSize: '0.8rem',
                              color: '#000000',
                              }}
                            >
                              {new Date(phase.start_date).toLocaleDateString()} -{' '}
                              {new Date(phase.end_date).toLocaleDateString()}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: '1.25rem',
                              color: '#000000',
                              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.15s ease',
                            }}
                          >
                            ›
                          </div>
                        </button>

                        {isOpen && (
                          <div
                            style={{
                              borderTop: '1px solid #000000',
                              padding: '0.75rem 1rem 1rem',
                              backgroundColor: '#ffffff',
                            }}
                          >
                            {phase.phase_discount_percentage && (
                              <div
                                style={{
                                  marginBottom: '0.5rem',
                                  fontSize: '0.875rem',
                                  color: '#000000',
                                }}
                              >
                                Phase Discount: {phase.phase_discount_percentage}%
                              </div>
                            )}

                            {phase.products && phase.products.length > 0 ? (
                              <div
                                style={{
                                  marginTop: '0.5rem',
                                  borderRadius: '0.5rem',
                                  border: '1px solid #000000',
                                  overflow: 'hidden',
                                  backgroundColor: '#ffffff',
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
                                      backgroundColor: '#ffffff',
                                      borderBottom: '1px solid #000000',
                                    }}
                                  >
                                    <tr>
                                      <th
                                        style={{
                                          textAlign: 'left',
                                          padding: '0.6rem 0.9rem',
                                          color: '#000000',
                                          fontWeight: 600,
                                        }}
                                      >
                                        Product
                                      </th>
                                      <th
                                        style={{
                                          textAlign: 'left',
                                          padding: '0.6rem 0.9rem',
                                          color: '#000000',
                                          fontWeight: 500,
                                        }}
                                      >
                                        Quantity
                                      </th>
                                      <th
                                        style={{
                                          textAlign: 'left',
                                          padding: '0.6rem 0.9rem',
                                          color: '#000000',
                                          fontWeight: 500,
                                        }}
                                      >
                                        Price
                                      </th>
                                      <th
                                        style={{
                                          textAlign: 'left',
                                          padding: '0.6rem 0.9rem',
                                          color: '#000000',
                                          fontWeight: 500,
                                        }}
                                      >
                                        Discount
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {phase.products.map((product, idx) => (
                                      <tr
                                        key={`${product.product_id}-${idx}`}
                                        style={{
                                          borderTop: '1px solid #000000',
                                          backgroundColor: '#ffffff',
                                        }}
                                      >
                                        <td
                                          style={{
                                            padding: '0.65rem 0.9rem',
                                            color: '#000000',
                                          }}
                                        >
                                          {product.product_name || product.product_id}
                                        </td>
                                        <td
                                          style={{
                                            padding: '0.65rem 0.9rem',
                                            color: '#000000',
                                          }}
                                        >
                                          {product.quantity ?? '—'}
                                        </td>
                                        <td
                                          style={{
                                            padding: '0.65rem 0.9rem',
                                            color: '#000000',
                                          }}
                                        >
                                          {product.price_base
                                            ? `$${(product.price_base / 100).toFixed(2)}`
                                            : '—'}
                                        </td>
                                        <td
                                          style={{
                                            padding: '0.65rem 0.9rem',
                                            color: '#000000',
                                          }}
                                        >
                                          {product.discount_percentage
                                            ? `${product.discount_percentage}%`
                                            : '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div
                                style={{
                                  padding: '1rem',
                                  textAlign: 'center',
                                  color: '#9ca3af',
                                  fontSize: '0.875rem',
                                }}
                              >
                                No products in this phase
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Invoices Section */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.9rem',
                border: '1px solid #000000',
                padding: '1.5rem',
                boxShadow: 'none',
              }}
            >
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  marginBottom: '1rem',
                }}
              >
                Invoices ({invoices.length})
              </h2>

              {invoices.length === 0 ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#000000',
                    fontSize: '0.9rem',
                  }}
                >
                  No invoices found for this schedule.
                </div>
              ) : (
                <div
                  style={{
                    borderRadius: '0.75rem',
                    border: '1px solid #000000',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff',
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
                        backgroundColor: '#ffffff',
                        borderBottom: '1px solid #000000',
                      }}
                    >
                      <tr>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '0.6rem 0.9rem',
                            color: '#000000',
                            fontWeight: 500,
                          }}
                        >
                          Invoice #
                        </th>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '0.6rem 0.9rem',
                            color: '#000000',
                            fontWeight: 500,
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '0.6rem 0.9rem',
                            color: '#000000',
                            fontWeight: 500,
                          }}
                        >
                          Date
                        </th>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '0.6rem 0.9rem',
                            color: '#000000',
                            fontWeight: 500,
                          }}
                        >
                          Due Date
                        </th>
                        <th
                          style={{
                            textAlign: 'right',
                            padding: '0.6rem 0.9rem',
                            color: '#000000',
                            fontWeight: 500,
                          }}
                        >
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices
                        .slice()
                        .reverse()
                        .map((invoice) => (
                          <tr
                            key={invoice.invoice_id}
                            style={{
                              borderTop: '1px solid #000000',
                              backgroundColor: '#ffffff',
                            }}
                          >
                            <td
                              style={{
                                padding: '0.65rem 0.9rem',
                                color: '#000000',
                                fontWeight: 600,
                              }}
                            >
                            {invoice.invoice_number || invoice.invoice_id}
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
                                fontWeight: 600,
                                backgroundColor: '#000000',
                                color: '#ffffff',
                              }}
                            >
                              {invoice.is_paid ? 'Paid' : invoice.status}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '0.65rem 0.9rem',
                                color: '#000000',
                            }}
                          >
                            {invoice.invoice_date
                              ? new Date(invoice.invoice_date).toLocaleDateString()
                              : '—'}
                          </td>
                          <td
                            style={{
                              padding: '0.65rem 0.9rem',
                                color: '#000000',
                            }}
                          >
                            {invoice.due_date
                              ? new Date(invoice.due_date).toLocaleDateString()
                              : '—'}
                          </td>
                          <td
                            style={{
                              padding: '0.65rem 0.9rem',
                              textAlign: 'right',
                                color: '#000000',
                                fontWeight: 600,
                            }}
                          >
                            {invoice.currency.toUpperCase()}{' '}
                            {(invoice.amount_total / 100).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
    </div>
  );
}

