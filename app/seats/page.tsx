'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  fetchSeatMeters,
  createSeatEvent,
  fetchSeatInvoiceForEvent,
  type SeatMeter,
  type SeatEventCreatePayload,
  type SeatInvoiceInfo,
} from '@/lib/seat-events';
import { Calendar } from '@/components/ui/calendar';

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

type SeatEventListItem = {
  id: string;
  seat_meter_id: string;
  customer_id: string;
  event_type: 'added' | 'removed';
  seats_added: number;
  seats_removed: number;
  event_timestamp: string;
  balance_before: number;
  balance_after: number;
};

function SeatsPage() {
  const { user, isLoaded } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [connection, setConnection] =
    useState<SonicConnectionResponse | null>(null);

  const [seatMeters, setSeatMeters] = useState<SeatMeter[]>([]);
  const [seatMetersError, setSeatMetersError] = useState<string | null>(null);
  const [seatMetersLoading, setSeatMetersLoading] = useState(false);

  const [seatCustomerId, setSeatCustomerId] = useState('');
  const [seatMeterId, setSeatMeterId] = useState('');
  const [seatChange, setSeatChange] = useState<number | ''>('');
  const [seatChangeType, setSeatChangeType] = useState<'add' | 'remove'>('add');
  const [seatEventTimestamp, setSeatEventTimestamp] = useState<string>('');
  const [seatEventDisplay, setSeatEventDisplay] = useState<string>('');
  const [eventPickerOpen, setEventPickerOpen] = useState(false);
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [seatEventLoading, setSeatEventLoading] = useState(false);
  const [seatEventSuccess, setSeatEventSuccess] = useState<string | null>(null);
  const [seatEventError, setSeatEventError] = useState<string | null>(null);

  const [invoiceInfo, setInvoiceInfo] = useState<SeatInvoiceInfo | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  function renderSeatChangePreview() {
    const numericChange =
      typeof seatChange === 'string'
        ? Number.parseInt(seatChange, 10)
        : seatChange;
    if (!numericChange || Number.isNaN(numericChange)) {
      return null;
    }

    const signedChange =
      seatChangeType === 'add' ? numericChange : -numericChange;
    const base =
      invoiceInfo && invoiceInfo.seats_balance != null
        ? invoiceInfo.seats_balance
        : null;
    const newTotal = base != null ? base + signedChange : null;

    if (base != null && newTotal != null) {
      return (
        <>
          Current seats_balance (from invoice): {base} seats
          <br />
          Change:{' '}
          {signedChange > 0 ? `+${signedChange}` : signedChange} seats → New
          total: {newTotal} seats
        </>
      );
    }

    return (
      <>
        Change: {seatChangeType === 'add' ? '+' : '-'}
        {numericChange} seats
      </>
    );
  }

  const [events, setEvents] = useState<SeatEventListItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  function ensurePickerStateFromTimestamp() {
    const existing = seatEventTimestamp;
    const base = existing ? new Date(existing) : new Date();
    if (Number.isNaN(base.getTime())) {
      return;
    }

    setEventDate(new Date(base.getFullYear(), base.getMonth(), base.getDate()));
  }

  function updateTimestamp(dateOverride?: Date | null) {
    const date = dateOverride ?? eventDate ?? new Date();
    if (!date) return;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Store timestamp at start of day, but display only the date in the UI
    const localDateTime = `${year}-${month}-${day}T00:00`;

    setEventDate(date);
    setSeatEventTimestamp(localDateTime);
    setSeatEventDisplay(date.toLocaleDateString());
  }

  // Load invoice information when customer, seat meter, and date are selected
  useEffect(() => {
    async function loadInvoice() {
      if (!isLoaded || !user) return;

      setInvoiceError(null);

      if (!seatCustomerId || !seatMeterId || !seatEventTimestamp) {
        setInvoiceInfo(null);
        return;
      }

      const email = user.primaryEmailAddress?.emailAddress;
      if (!email) {
        setInvoiceInfo(null);
        return;
      }

      const meter = seatMeters.find((m) => m.id === seatMeterId);
      const seatTypeId = meter?.seat_type_id;
      if (!seatTypeId) {
        setInvoiceInfo(null);
        return;
      }

      setInvoiceLoading(true);

      try {
        const info = await fetchSeatInvoiceForEvent(
          seatCustomerId,
          seatTypeId,
          seatEventTimestamp,
          email,
        );
        setInvoiceInfo(info);
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Unknown error while loading invoice details';
        setInvoiceError(message);
        setInvoiceInfo(null);
      } finally {
        setInvoiceLoading(false);
      }
    }

    void loadInvoice();
  }, [
    isLoaded,
    user,
    seatCustomerId,
    seatMeterId,
    seatEventTimestamp,
    seatMeters,
  ]);

  async function ensureConnection(userEmail: string) {
    if (!SONIC_API_KEY) {
      throw new Error(
        'Sonic API key is not configured. Set NEXT_PUBLIC_SONIC_API_KEY.',
      );
    }

    const res = await fetch(
      `${SONIC_API_BASE}/api/integrations/api-keys/validate`,
      {
        headers: {
          'X-Sonic-Api-Key': SONIC_API_KEY,
          'X-User-Email': userEmail,
        },
      },
    );

    const text = await res.text().catch(() => '');

    if (!res.ok) {
      let errorMessage =
        text || `Failed to connect to Sonic (status ${res.status})`;

      try {
        const errorJson = JSON.parse(text);
        errorMessage = errorJson.detail || errorMessage;
      } catch {
        // Not JSON
      }

      throw new Error(errorMessage);
    }

    const data = (text ? JSON.parse(text) : null) as SonicConnectionResponse;
    setConnection(data);
    return data;
  }

  async function loadInitialData() {
    if (!isLoaded || !user) return;
    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) {
      setError('Unable to get your email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const conn = await ensureConnection(email);

      // Load seat meters
      setSeatMetersLoading(true);
      setSeatMetersError(null);
      try {
        const meters = await fetchSeatMeters(email);
        setSeatMeters(meters);
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Unknown error while loading seat meters';
        setSeatMetersError(message);
      } finally {
        setSeatMetersLoading(false);
      }

      // Load seat events
      setEventsLoading(true);
      setEventsError(null);
      try {
        const res = await fetch(
          `${SONIC_API_BASE}/api/integrations/api-keys/seat/seat-events?page_size=100`,
          {
            headers: {
              'X-Sonic-Api-Key': SONIC_API_KEY,
              'X-User-Email': email,
            },
          },
        );

        const text = await res.text().catch(() => '');

        if (!res.ok) {
          let errorMessage =
            text || `Failed to load seat events (status ${res.status})`;

          try {
            const errorJson = JSON.parse(text);
            errorMessage = errorJson.detail || errorMessage;
          } catch {
            // Not JSON
          }

          throw new Error(errorMessage);
        }

        const data = text ? JSON.parse(text) : null;
        const list = (data?.events || []) as SeatEventListItem[];
        setEvents(Array.isArray(list) ? list : []);
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Unknown error while loading seat events';
        setEventsError(message);
      } finally {
        setEventsLoading(false);
      }
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

  useEffect(() => {
    void loadInitialData();
  }, [isLoaded, user]);

  async function handleCreateSeatEvent() {
    if (!isLoaded || !user) return;
    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) {
      setSeatEventError('Unable to get your email address.');
      return;
    }

    if (!seatCustomerId) {
      setSeatEventError('Please select a customer.');
      return;
    }
    if (!seatMeterId) {
      setSeatEventError('Please select a seat meter.');
      return;
    }
    const seats =
      typeof seatChange === 'string'
        ? parseInt(seatChange, 10)
        : seatChange;
    if (!seats || seats <= 0) {
      setSeatEventError('Please enter a positive number of seats.');
      return;
    }

    setSeatEventLoading(true);
    setSeatEventError(null);
    setSeatEventSuccess(null);

    try {
      const payloadBase: SeatEventCreatePayload =
        seatChangeType === 'add'
          ? {
              seat_meter_id: seatMeterId,
              customer_id: seatCustomerId,
              event_type: 'added',
              seats_added: seats,
            }
          : {
              seat_meter_id: seatMeterId,
              customer_id: seatCustomerId,
              event_type: 'removed',
              seats_removed: seats,
            };

      const payload: SeatEventCreatePayload = {
        ...payloadBase,
        ...(seatEventTimestamp
          ? {
              event_timestamp: new Date(
                seatEventTimestamp,
              ).toISOString(),
            }
          : {}),
      };

      const res = await createSeatEvent(payload, email);
      const balanceAfter = res?.balance_after;

      setSeatEventSuccess(
        balanceAfter !== undefined
          ? `Seat event created. New balance: ${balanceAfter} seats.`
          : 'Seat event created successfully.',
      );
      setSeatChange('');
      setSeatEventTimestamp('');
      setSeatEventDisplay('');

      // Refresh events
      await loadInitialData();
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Unknown error while creating seat event';
      setSeatEventError(message);
    } finally {
      setSeatEventLoading(false);
    }
  }

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
        <div style={{ color: '#000000' }}>Please sign in to view seats.</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '2rem 1.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        backgroundColor: '#f5f5f5',
        color: '#000000',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
          padding: '1.75rem 1.5rem 1.75rem',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                color: '#000000',
                marginBottom: '0.25rem',
              }}
            >
              Seat Events
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#111827' }}>
              Quickly adjust seats for a customer and review recent changes.
            </p>
          </div>
          {connection && (
            <div
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '999px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                fontSize: '0.8rem',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '999px',
                  backgroundColor: '#22c55e',
                }}
              />
              <span style={{ fontWeight: 600 }}>Connected</span>
              <span style={{ opacity: 0.6 }}>to {connection.organization_name}</span>
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '0.85rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid #f97316',
              backgroundColor: '#fffbeb',
              color: '#7c2d12',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Add Seat Event */}
        <div
          style={{
            borderRadius: '0.9rem',
            border: '1px solid #e5e7eb',
            padding: '1.25rem 1.1rem 1.4rem',
            backgroundColor: '#ffffff',
            marginBottom: '1.75rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: '#000000',
              marginBottom: '0.9rem',
            }}
          >
            Add Seat Event
          </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          {/* Customer */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 500,
                marginBottom: '0.35rem',
              }}
            >
              Customer
            </label>
            <select
              value={seatCustomerId}
              onChange={(e) => setSeatCustomerId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #000000',
                backgroundColor: '#ffffff',
                fontSize: '0.9rem',
              }}
            >
              <option value="">Select customer</option>
              {connection?.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.email ? `(${c.email})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Seat Meter */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 500,
                marginBottom: '0.35rem',
              }}
            >
              Seat Meter
            </label>
            <select
              value={seatMeterId}
              onChange={(e) => setSeatMeterId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #000000',
                backgroundColor: '#ffffff',
                fontSize: '0.9rem',
              }}
            >
              <option value="">
                {seatMetersLoading ? 'Loading seat meters...' : 'Select seat meter'}
              </option>
              {seatMeters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {seatMetersError && (
              <div
                style={{
                  marginTop: '0.25rem',
                  fontSize: '0.8rem',
                  color: '#000000',
                }}
              >
                {seatMetersError}
              </div>
            )}
          </div>

          {/* Event Date (just after seat meter) */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 500,
                marginBottom: '0.35rem',
              }}
            >
              Event Date (optional)
            </label>
            <div
              style={{
                position: 'relative',
                width: '100%',
              }}
            >
              <input
                type="text"
                value={seatEventDisplay}
                readOnly
                placeholder="Pick a date"
                style={{
                  width: '100%',
                  padding: '0.5rem 2.25rem 0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #000000',
                  backgroundColor: '#ffffff',
                  fontSize: '0.9rem',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!eventPickerOpen) {
                    ensurePickerStateFromTimestamp();
                  }
                  setEventPickerOpen((open) => !open);
                }}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                📅
              </button>
              {eventPickerOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    zIndex: 10,
                    padding: 0,
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                  }}
                >
                  <Calendar
                    mode="single"
                    selected={eventDate ?? undefined}
                    onSelect={(date) => {
                      if (date) {
                        updateTimestamp(date);
                        setEventPickerOpen(false);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Seats */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 500,
                marginBottom: '0.35rem',
              }}
            >
              Seats
            </label>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
              }}
            >
              <select
                value={seatChangeType}
                onChange={(e) =>
                  setSeatChangeType(e.target.value as 'add' | 'remove')
                }
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #000000',
                  backgroundColor: '#ffffff',
                  fontSize: '0.9rem',
                }}
              >
                <option value="add">Add</option>
                <option value="remove">Remove</option>
              </select>
              <input
                type="number"
                min={1}
                value={seatChange}
                onChange={(e) =>
                  setSeatChange(
                    e.target.value === ''
                      ? ''
                      : Number.parseInt(e.target.value, 10),
                  )
                }
                style={{
                  flex: 1,
                  minWidth: '150px',
                  maxWidth: '220px',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #000000',
                  fontSize: '0.9rem',
                }}
                placeholder="Number of seats"
              />
            </div>
            {seatChange && (
              <div
                style={{
                  marginTop: '0.25rem',
                  fontSize: '0.8rem',
                  color: '#000000',
                }}
              >
                {renderSeatChangePreview()}
              </div>
            )}
          </div>
        </div>

        {/* Invoice info below inputs */}
        {seatCustomerId &&
          seatMeterId &&
          seatEventTimestamp &&
          (invoiceLoading || invoiceInfo || invoiceError) && (
            <div
              style={{
                marginTop: '1rem',
                marginBottom: '1rem',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                backgroundColor: '#f5f7ff',
              }}
            >
              {invoiceLoading ? (
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: '#000000',
                  }}
                >
                  Loading invoice details…
                </div>
              ) : invoiceError ? (
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: '#000000',
                  }}
                >
                  {invoiceError}
                </div>
              ) : invoiceInfo ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    fontSize: '0.9rem',
                    color: '#000000',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>Invoice:</span>{' '}
                    {invoiceInfo.invoice_number || invoiceInfo.invoice_id}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Current seats_balance:</span>{' '}
                    {invoiceInfo.seats_balance ?? 'N/A'}
                  </div>
                  {invoiceInfo.minimum_seats != null && (
                    <div>
                      <span style={{ fontWeight: 600 }}>Minimum seats:</span>{' '}
                      {invoiceInfo.minimum_seats}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: '#000000',
                  }}
                >
                  No matching invoice found for this customer, meter, and date.
                </div>
              )}
            </div>
          )}

        {seatEventError && (
          <div
            style={{
              marginBottom: '0.75rem',
              padding: '0.6rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #f97316',
              backgroundColor: '#fffbeb',
              color: '#7c2d12',
              fontSize: '0.85rem',
            }}
          >
            {seatEventError}
          </div>
        )}
        {seatEventSuccess && (
          <div
            style={{
              marginBottom: '0.75rem',
              padding: '0.6rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #22c55e',
              backgroundColor: '#ecfdf3',
              color: '#14532d',
              fontSize: '0.85rem',
            }}
          >
            {seatEventSuccess}
          </div>
        )}

        <button
          type="button"
          onClick={handleCreateSeatEvent}
          disabled={seatEventLoading}
          style={{
            marginTop: '0.25rem',
            padding: '0.5rem 1.25rem',
            borderRadius: '999px',
            border: '1px solid #000000',
            backgroundColor: seatEventLoading ? '#ffffff' : '#000000',
            color: seatEventLoading ? '#000000' : '#ffffff',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: seatEventLoading ? 'default' : 'pointer',
            opacity: seatEventLoading ? 0.6 : 1,
          }}
        >
          {seatEventLoading ? 'Saving…' : 'Add Seat Event'}
        </button>
      </div>

      {/* Seat Events List */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.9rem',
          border: '1px solid #e5e7eb',
          padding: '1.25rem 1.1rem 1.4rem',
        }}
      >
        <h2
          style={{
            fontSize: '1.05rem',
            fontWeight: 600,
            color: '#000000',
            marginBottom: '0.9rem',
          }}
        >
          Recent Seat Events
        </h2>

        {eventsError && (
          <div
            style={{
              marginBottom: '0.75rem',
              padding: '0.6rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #f97316',
              backgroundColor: '#fffbeb',
              color: '#7c2d12',
              fontSize: '0.85rem',
            }}
          >
            {eventsError}
          </div>
        )}

        {eventsLoading ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#000000',
              fontSize: '0.9rem',
            }}
          >
            Loading seat events…
          </div>
        ) : events.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#000000',
              fontSize: '0.9rem',
            }}
          >
            No seat events found.
          </div>
        ) : (
          <div
            style={{
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb',
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
                    Time
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '0.6rem 0.9rem',
                      color: '#000000',
                      fontWeight: 600,
                    }}
                  >
                    Customer
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '0.6rem 0.9rem',
                      color: '#000000',
                      fontWeight: 600,
                    }}
                  >
                    Seat Meter
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '0.6rem 0.9rem',
                      color: '#000000',
                      fontWeight: 600,
                    }}
                  >
                    Change
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '0.6rem 0.9rem',
                      color: '#000000',
                      fontWeight: 600,
                    }}
                  >
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const customer =
                    connection?.customers.find((c) => c.id === ev.customer_id) ??
                    null;
                  const meter =
                    seatMeters.find((m) => m.id === ev.seat_meter_id) ?? null;
                  const date = ev.event_timestamp
                    ? new Date(ev.event_timestamp).toLocaleString()
                    : '';

                  const changeText =
                    ev.event_type === 'added'
                      ? `+${ev.seats_added}`
                      : `-${ev.seats_removed}`;

                  return (
                    <tr
                      key={ev.id}
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
                        {date}
                      </td>
                      <td
                        style={{
                          padding: '0.65rem 0.9rem',
                          color: '#000000',
                        }}
                      >
                        {customer?.name || ev.customer_id}
                      </td>
                      <td
                        style={{
                          padding: '0.65rem 0.9rem',
                          color: '#000000',
                        }}
                      >
                        {meter?.name || ev.seat_meter_id}
                      </td>
                      <td
                        style={{
                          padding: '0.65rem 0.9rem',
                          color: '#000000',
                        }}
                      >
                        {changeText}
                      </td>
                      <td
                        style={{
                          padding: '0.65rem 0.9rem',
                          color: '#000000',
                        }}
                      >
                        {ev.balance_before} → {ev.balance_after}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}


export default SeatsPage;

