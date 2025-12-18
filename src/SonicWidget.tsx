'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createSeatEvent as createSeatEventApi,
  fetchCustomerSchedules,
  fetchDashboardStats,
  fetchSeatEvents,
  fetchSeatInvoiceForEvent,
  fetchSeatMeters,
  type SeatEventCreatePayload,
  type SeatEventListItem,
  type SeatInvoiceInfo,
  type DashboardStats,
  type SeatMeter,
  type SonicClientConfig,
  type SonicConnectionResponse,
  type SonicEnvironment,
  validateConnection,
  type SonicSchedule,
  type SonicCustomer,
} from './sonicClient';

export interface SonicUser {
  email: string;
  id?: string;
}

export interface SonicTheme {
  mode?: 'light' | 'dark';
  primaryColor?: string;
  borderColor?: string;
  backgroundColor?: string;
}

export interface SonicWidgetConfig {
  apiKey: string;
  user: SonicUser;
  env?: SonicEnvironment;
  baseUrl?: string;
  theme?: SonicTheme;
  buttonLabel?: string;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}

interface DashboardPaneProps {
  stats: DashboardStats;
  connection: SonicConnectionResponse;
}

function DashboardPane({ stats, connection }: DashboardPaneProps) {
  const cards = [
    {
      title: 'Organization',
      value: connection.organization_name,
      icon: '🏢',
    },
    {
      title: 'Total Customers',
      value: connection.total_customers.toString(),
      icon: '👥',
    },
    {
      title: 'Total Schedules',
      value: stats.totalSchedules.toString(),
      icon: '📅',
    },
    {
      title: 'Active Schedules',
      value: stats.activeSchedules.toString(),
      icon: '✅',
    },
    {
      title: 'Total Invoices',
      value: stats.totalInvoices.toString(),
      icon: '📄',
    },
    {
      title: 'Paid Invoices',
      value: stats.paidInvoices.toString(),
      icon: '💰',
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.9rem',
        }}
      >
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.9rem',
              border: '1px solid #e5e7eb',
              padding: '1.1rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '1.6rem' }}>{card.icon}</span>
            </div>
            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 700,
              }}
            >
              {card.value}
            </div>
            <div
              style={{
                fontSize: '0.85rem',
                color: '#6b7280',
              }}
            >
              {card.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CustomersPaneProps {
  connection: SonicConnectionResponse;
  theme: SonicTheme;
  onSelectCustomer: (customerId: string) => void | Promise<void>;
}

function CustomersPane({
  connection,
  theme,
  onSelectCustomer,
}: CustomersPaneProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers =
    connection.customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
            }}
          >
            Customers
          </h2>
          <p
            style={{
              fontSize: '0.9rem',
              opacity: 0.8,
            }}
          >
            Browse and drill into your Sonic customers.
          </p>
        </div>
        <div
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: '999px',
            border: '1px solid #e5e7eb',
            fontSize: '0.8rem',
          }}
        >
          {connection.total_customers} customers
        </div>
      </div>

      <div>
        <input
          type="text"
          placeholder="Search customers by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.65rem 0.9rem',
            borderRadius: '0.6rem',
            border: `1px solid ${theme.borderColor ?? '#000000'}`,
            fontSize: '0.9rem',
          }}
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <div
          style={{
            padding: '2.5rem',
            textAlign: 'center',
            borderRadius: '0.9rem',
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            fontSize: '0.9rem',
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '0.9rem',
          }}
        >
          {filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => onSelectCustomer(customer.id)}
              style={{
                textAlign: 'left',
                backgroundColor: '#ffffff',
                borderRadius: '0.9rem',
                border: '1px solid #e5e7eb',
                padding: '1.1rem 1rem',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.7rem',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '0.75rem',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                  }}
                >
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                    }}
                  >
                    {customer.name}
                  </div>
                  {customer.email && (
                    <div
                      style={{
                        fontSize: '0.8rem',
                        opacity: 0.8,
                      }}
                    >
                      {customer.email}
                    </div>
                  )}
                </div>
              </div>
              {customer.phone && (
                <div
                  style={{
                    fontSize: '0.8rem',
                    opacity: 0.8,
                  }}
                >
                  📞 {customer.phone}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface CustomerDetailPaneProps {
  customer: SonicCustomer;
  schedules: SonicSchedule[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

function CustomerDetailPane({
  customer,
  schedules,
  loading,
  error,
  onBack,
}: CustomerDetailPaneProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          alignSelf: 'flex-start',
          border: 'none',
          background: 'transparent',
          padding: 0,
          fontSize: '0.85rem',
          color: '#6b7280',
          cursor: 'pointer',
        }}
      >
        ← Back to customers
      </button>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.9rem',
          border: '1px solid #e5e7eb',
          padding: '1.4rem 1.3rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '1rem',
            backgroundColor: '#000000',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.5rem',
          }}
        >
          {customer.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
            }}
          >
            {customer.name}
          </div>
          <div
            style={{
              marginTop: '0.35rem',
              fontSize: '0.86rem',
              color: '#6b7280',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
            }}
          >
            {customer.email && (
              <span>
                📧 <span>{customer.email}</span>
              </span>
            )}
            {customer.phone && (
              <span>
                📞 <span>{customer.phone}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.9rem',
          border: '1px solid #e5e7eb',
          padding: '1.4rem 1.3rem',
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
            }}
          >
            Schedules ({schedules.length})
          </h2>
        </div>

        {error && (
          <div
            style={{
              marginBottom: '0.85rem',
              padding: '0.75rem 0.85rem',
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

        {loading ? (
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
              color: '#6b7280',
              fontSize: '0.9rem',
            }}
          >
            No schedules found for this customer.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '0.85rem',
            }}
          >
            {schedules.map((schedule) => (
              <div
                key={schedule.schedule_id}
                style={{
                  padding: '1rem',
                  borderRadius: '0.8rem',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.96rem',
                      fontWeight: 600,
                    }}
                  >
                    {schedule.billing_schedule_label ||
                      schedule.contract_name ||
                      'Unnamed Schedule'}
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
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
                    fontSize: '0.8rem',
                    color: '#6b7280',
                  }}
                >
                  {schedule.start_date &&
                    new Date(schedule.start_date).toLocaleDateString()}
                  {schedule.end_date &&
                    ` - ${new Date(schedule.end_date).toLocaleDateString()}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export interface SonicWidgetProps extends SonicWidgetConfig {}

export function SonicWidget(props: SonicWidgetProps) {
  const {
    apiKey,
    user,
    env,
    baseUrl,
    theme,
    buttonLabel = 'Manage Seats',
    onOpen,
    onClose,
    onError,
  } = props;

  const [open, setOpen] = useState(false);

  const clientConfig = useMemo<SonicClientConfig>(
    () => ({
      apiKey,
      env,
      baseUrl,
    }),
    [apiKey, env, baseUrl],
  );

  const handleOpen = useCallback(() => {
    setOpen(true);
    if (onOpen) onOpen();
  }, [onOpen]);

  const handleClose = useCallback(() => {
    setOpen(false);
    if (onClose) onClose();
  }, [onClose]);

  const resolvedTheme = useMemo<SonicTheme>(() => {
    const mode = theme?.mode ?? 'light';
    if (mode === 'dark') {
      return {
        mode,
        primaryColor: theme?.primaryColor ?? '#ffffff',
        borderColor: theme?.borderColor ?? '#4b5563',
        backgroundColor: theme?.backgroundColor ?? '#000000',
      };
    }

    // Default: minimal white dashboard-style UI with black/neutral accents
    return {
      mode,
      primaryColor: theme?.primaryColor ?? '#000000',
      borderColor: theme?.borderColor ?? '#000000',
      backgroundColor: theme?.backgroundColor ?? '#ffffff',
    };
  }, [theme]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        style={{
          padding: '0.5rem 1.25rem',
          borderRadius: '999px',
          border: `1px solid ${resolvedTheme.borderColor ?? '#000000'}`,
          backgroundColor: resolvedTheme.primaryColor ?? '#000000',
          color: resolvedTheme.mode === 'dark' ? '#000000' : '#ffffff',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {buttonLabel}
      </button>

      {open && (
        <SonicModal onClose={handleClose} theme={resolvedTheme}>
          <SonicWorkspaceWidget
            clientConfig={clientConfig}
            userEmail={user.email}
            theme={resolvedTheme}
            onError={onError}
          />
        </SonicModal>
      )}
    </>
  );
}

interface SonicModalProps {
  children: React.ReactNode;
  onClose: () => void;
  theme: SonicTheme;
}

function SonicModal({ children, onClose, theme }: SonicModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: '960px',
          width: '100%',
          maxHeight: '90vh',
          margin: '1.5rem',
          backgroundColor: theme.backgroundColor ?? '#ffffff',
          color: theme.mode === 'dark' ? '#ffffff' : '#000000',
          borderRadius: '1rem',
          border: `1px solid ${theme.borderColor ?? '#000000'}`,
          boxShadow: '0 20px 45px rgba(15,23,42,0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.9rem 1.3rem',
            borderBottom: `1px solid ${theme.borderColor ?? '#000000'}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.15rem',
            }}
          >
            <span
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              Sonic Seat Events
            </span>
            <span
              style={{
                fontSize: '0.8rem',
                opacity: 0.75,
              }}
            >
              Adjust seats for your customers and review recent changes
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '999px',
              border: `1px solid ${theme.borderColor ?? '#000000'}`,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div
          style={{
            padding: '1.25rem 1.5rem 1.5rem',
            overflow: 'auto',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

interface SeatEventsWidgetProps {
  connection: SonicConnectionResponse;
  clientConfig: SonicClientConfig;
  userEmail: string;
  theme: SonicTheme;
  onError?: (error: Error) => void;
}

type ActiveView =
  | 'dashboard'
  | 'customers'
  | 'customer-detail'
  | 'seat-events';

interface SonicWorkspaceWidgetProps {
  clientConfig: SonicClientConfig;
  userEmail: string;
  theme: SonicTheme;
  onError?: (error: Error) => void;
}

function SonicWorkspaceWidget({
  clientConfig,
  userEmail,
  theme,
  onError,
}: SonicWorkspaceWidgetProps) {
  const [connection, setConnection] =
    useState<SonicConnectionResponse | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalSchedules: 0,
    activeSchedules: 0,
    totalInvoices: 0,
    paidInvoices: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [customerSchedules, setCustomerSchedules] = useState<
    Record<string, SonicSchedule[]>
  >({});
  const [customerSchedulesLoading, setCustomerSchedulesLoading] = useState<
    Record<string, boolean>
  >({});
  const [customerSchedulesError, setCustomerSchedulesError] = useState<
    Record<string, string | null>
  >({});

  function emitError(e: unknown, fallbackMessage: string) {
    const message = e instanceof Error ? e.message : fallbackMessage;
    setError(message);
    if (onError) {
      onError(e instanceof Error ? e : new Error(message));
    }
  }

  useEffect(() => {
    async function loadWorkspace() {
      setLoading(true);
      setError(null);

      try {
        const conn = await validateConnection(clientConfig, userEmail);
        setConnection(conn);

        const s = await fetchDashboardStats(clientConfig, conn, userEmail);
        setStats(s);
      } catch (e) {
        emitError(e, 'Unknown error while connecting to Sonic');
      } finally {
        setLoading(false);
      }
    }

    void loadWorkspace();
  }, [clientConfig, userEmail]);

  async function ensureCustomerSchedules(customerId: string) {
    if (customerSchedules[customerId]) return;

    setCustomerSchedulesLoading((prev) => ({ ...prev, [customerId]: true }));
    setCustomerSchedulesError((prev) => ({ ...prev, [customerId]: null }));

    try {
      const schedules = await fetchCustomerSchedules(
        clientConfig,
        customerId,
        userEmail,
      );
      setCustomerSchedules((prev) => ({ ...prev, [customerId]: schedules }));
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Unknown error while loading schedules';
      setCustomerSchedulesError((prev) => ({ ...prev, [customerId]: message }));
      if (onError) {
        onError(e instanceof Error ? e : new Error(message));
      }
    } finally {
      setCustomerSchedulesLoading((prev) => ({ ...prev, [customerId]: false }));
    }
  }

  if (loading && !connection) {
    return (
      <div
        style={{
          padding: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div>Loading Sonic workspace…</div>
      </div>
    );
  }

  if (!connection) {
    return (
      <div
        style={{
          padding: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div>
          {error ||
            'Unable to load Sonic workspace. Please check your API key and try again.'}
        </div>
      </div>
    );
  }

  const selectedCustomer = selectedCustomerId
    ? connection.customers.find((c) => c.id === selectedCustomerId) ?? null
    : null;

  const selectedCustomerSchedules = selectedCustomerId
    ? customerSchedules[selectedCustomerId] ?? []
    : [];

  const selectedCustomerSchedulesLoading =
    (selectedCustomerId && customerSchedulesLoading[selectedCustomerId]) ||
    false;

  const selectedCustomerSchedulesError =
    (selectedCustomerId && customerSchedulesError[selectedCustomerId]) || null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {error && (
        <div
          style={{
            marginBottom: '0.5rem',
            padding: '0.75rem 0.9rem',
            borderRadius: '0.75rem',
            border: '1px solid #f97316',
            backgroundColor: '#fffbeb',
            color: '#7c2d12',
            fontSize: '0.85rem',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              opacity: 0.7,
              marginBottom: '0.25rem',
            }}
          >
            Sonic organization
          </div>
          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
            }}
          >
            {connection.organization_name}
          </div>
        </div>
        <div
          style={{
            display: 'inline-flex',
            padding: '0.35rem 0.75rem',
            borderRadius: '999px',
            border: '1px solid rgba(148,163,184,0.4)',
            backgroundColor: 'rgba(15,23,42,0.02)',
            fontSize: '0.8rem',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '999px',
              backgroundColor: '#22c55e',
            }}
          />
          <span>Connected</span>
          <span style={{ opacity: 0.6 }}>
            {connection.total_customers} customers
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderRadius: '999px',
          padding: '0.15rem',
          backgroundColor: 'rgba(15,23,42,0.03)',
          border: '1px solid rgba(148,163,184,0.4)',
          width: 'fit-content',
        }}
      >
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'customers', label: 'Customers' },
          { id: 'seat-events', label: 'Seat Events' },
        ].map((tab) => {
          const active = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveView(tab.id as ActiveView);
                if (tab.id !== 'customer-detail') {
                  setSelectedCustomerId(null);
                }
              }}
              style={{
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                borderRadius: '999px',
                padding: '0.35rem 0.9rem',
                fontSize: '0.85rem',
                fontWeight: active ? 600 : 500,
                backgroundColor: active ? '#000000' : 'transparent',
                color: active ? '#ffffff' : '#111827',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeView === 'dashboard' && (
        <DashboardPane stats={stats} connection={connection} />
      )}
      {activeView === 'customers' && (
        <CustomersPane
          connection={connection}
          theme={theme}
          onSelectCustomer={async (customerId) => {
            setSelectedCustomerId(customerId);
            setActiveView('customer-detail');
            await ensureCustomerSchedules(customerId);
          }}
        />
      )}
      {activeView === 'customer-detail' && selectedCustomer && (
        <CustomerDetailPane
          customer={selectedCustomer}
          schedules={selectedCustomerSchedules}
          loading={selectedCustomerSchedulesLoading}
          error={selectedCustomerSchedulesError}
          onBack={() => {
            setActiveView('customers');
          }}
        />
      )}
      {activeView === 'seat-events' && (
        <SeatEventsWidget
          connection={connection}
          clientConfig={clientConfig}
          userEmail={userEmail}
          theme={theme}
          onError={onError}
        />
      )}
    </div>
  );
}

function SeatEventsWidget({
  connection,
  clientConfig,
  userEmail,
  theme,
  onError,
}: SeatEventsWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const localDateTime = `${year}-${month}-${day}T00:00`;

    setEventDate(date);
    setSeatEventTimestamp(localDateTime);
    setSeatEventDisplay(date.toLocaleDateString());
  }

  async function loadInvoice() {
    setInvoiceError(null);

    if (!seatCustomerId || !seatMeterId || !seatEventTimestamp) {
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
        clientConfig,
        seatCustomerId,
        seatTypeId,
        seatEventTimestamp,
        userEmail,
      );
      setInvoiceInfo(info);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Unknown error while loading invoice details';
      setInvoiceError(message);
      setInvoiceInfo(null);
      if (onError) {
        onError(e instanceof Error ? e : new Error(message));
      }
    } finally {
      setInvoiceLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setError(null);

      setSeatMetersLoading(true);
      setSeatMetersError(null);
      try {
        const meters = await fetchSeatMeters(clientConfig, userEmail);
        setSeatMeters(meters);
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Unknown error while loading seat meters';
        setSeatMetersError(message);
        if (onError) {
          onError(e instanceof Error ? e : new Error(message));
        }
      } finally {
        setSeatMetersLoading(false);
      }

      setEventsLoading(true);
      setEventsError(null);
      try {
        const list = await fetchSeatEvents(clientConfig, userEmail);
        setEvents(list);
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Unknown error while loading seat events';
        setEventsError(message);
        if (onError) {
          onError(e instanceof Error ? e : new Error(message));
        }
      } finally {
        setEventsLoading(false);
        setLoading(false);
      }
    }

    void loadInitialData();
  }, [clientConfig, userEmail, onError]);

  useEffect(() => {
    if (!seatCustomerId || !seatMeterId || !seatEventTimestamp) {
      setInvoiceInfo(null);
      return;
    }

    void loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seatCustomerId, seatMeterId, seatEventTimestamp, userEmail]);

  async function handleCreateSeatEvent() {
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
              event_timestamp: new Date(seatEventTimestamp).toISOString(),
            }
          : {}),
      };

      const res = await createSeatEventApi(
        clientConfig,
        payload,
        userEmail,
      );
      const balanceAfter = (res as { balance_after?: number }).balance_after;

      setSeatEventSuccess(
        balanceAfter !== undefined
          ? `Seat event created. New balance: ${balanceAfter} seats.`
          : 'Seat event created successfully.',
      );
      setSeatChange('');
      setSeatEventTimestamp('');
      setSeatEventDisplay('');

      setEventsLoading(true);
      setEventsError(null);
      try {
        const list = await fetchSeatEvents(clientConfig, userEmail);
        setEvents(list);
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Unknown error while loading seat events';
        setEventsError(message);
        if (onError) {
          onError(e instanceof Error ? e : new Error(message));
        }
      } finally {
        setEventsLoading(false);
      }
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Unknown error while creating seat event';
      setSeatEventError(message);
      if (onError) {
        onError(e instanceof Error ? e : new Error(message));
      }
    } finally {
      setSeatEventLoading(false);
    }
  }

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
          Change: {signedChange > 0 ? `+${signedChange}` : signedChange} seats → New
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

  if (loading) {
    return (
      <div
        style={{
          padding: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div>Loading Sonic seat events…</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '0.25rem',
        backgroundColor: theme.mode === 'dark' ? '#000000' : '#f5f5f5',
        color: theme.mode === 'dark' ? '#ffffff' : '#000000',
      }}
    >
      <div
        style={{
          backgroundColor: theme.backgroundColor ?? '#ffffff',
          borderRadius: '1rem',
          border: `1px solid ${
            theme.mode === 'dark' ? '#4b5563' : '#e5e7eb'
          }`,
          boxShadow:
            '0 12px 30px rgba(15,23,42,0.08)',
          padding: '1.5rem 1.3rem 1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                marginBottom: '0.25rem',
              }}
            >
              Seat Events
            </h1>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              Quickly adjust seats for a customer and review recent changes.
            </p>
          </div>
          {connection && (
            <div
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '999px',
                border: `1px solid ${
                  theme.mode === 'dark' ? '#4b5563' : '#e5e7eb'
                }`,
                backgroundColor:
                  theme.mode === 'dark' ? '#020617' : '#f9fafb',
                fontSize: '0.8rem',
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
              <span style={{ opacity: 0.6 }}>
                to {connection.organization_name}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              marginBottom: '1.05rem',
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

        <div
          style={{
            borderRadius: '0.9rem',
            border: `1px solid ${
              theme.mode === 'dark' ? '#4b5563' : '#e5e7eb'
            }`,
            padding: '1.2rem 1.05rem 1.35rem',
            backgroundColor: theme.backgroundColor ?? '#ffffff',
            marginBottom: '1.5rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.02rem',
              fontWeight: 600,
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
                  border: `1px solid ${theme.borderColor ?? '#000000'}`,
                  backgroundColor: theme.backgroundColor ?? '#ffffff',
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
                  border: `1px solid ${theme.borderColor ?? '#000000'}`,
                  backgroundColor: theme.backgroundColor ?? '#ffffff',
                  fontSize: '0.9rem',
                }}
              >
                <option value="">
                  {seatMetersLoading
                    ? 'Loading seat meters...'
                    : 'Select seat meter'}
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
                  }}
                >
                  {seatMetersError}
                </div>
              )}
            </div>

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
                  type="date"
                  value={
                    eventDate
                      ? `${eventDate.getFullYear()}-${String(
                          eventDate.getMonth() + 1,
                        ).padStart(2, '0')}-${String(
                          eventDate.getDate(),
                        ).padStart(2, '0')}`
                      : ''
                  }
                  onChange={(e) => {
                    if (!e.target.value) {
                      setEventDate(null);
                      setSeatEventTimestamp('');
                      setSeatEventDisplay('');
                      return;
                    }
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    updateTimestamp(date);
                  }}
                  onFocus={() => {
                    if (!eventPickerOpen) {
                      ensurePickerStateFromTimestamp();
                      setEventPickerOpen(true);
                    }
                  }}
                  onBlur={() => {
                    setEventPickerOpen(false);
                  }}
                  placeholder="Pick a date"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${theme.borderColor ?? '#000000'}`,
                    backgroundColor: theme.backgroundColor ?? '#ffffff',
                    fontSize: '0.9rem',
                  }}
                />
                {seatEventDisplay && (
                  <div
                    style={{
                      marginTop: '0.2rem',
                      fontSize: '0.8rem',
                      opacity: 0.8,
                    }}
                  >
                    {seatEventDisplay}
                  </div>
                )}
              </div>
            </div>

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
                    border: `1px solid ${theme.borderColor ?? '#000000'}`,
                    backgroundColor: theme.backgroundColor ?? '#ffffff',
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
                    border: `1px solid ${theme.borderColor ?? '#000000'}`,
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
                  }}
                >
                  {renderSeatChangePreview()}
                </div>
              )}
            </div>
          </div>

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
                  border: `1px solid ${
                    theme.mode === 'dark' ? '#4b5563' : '#e5e7eb'
                  }`,
                  backgroundColor:
                    theme.mode === 'dark' ? '#020617' : '#f5f7ff',
                }}
              >
                {invoiceLoading ? (
                  <div
                    style={{
                      fontSize: '0.9rem',
                    }}
                  >
                    Loading invoice details…
                  </div>
                ) : invoiceError ? (
                  <div
                    style={{
                      fontSize: '0.9rem',
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
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>Invoice:</span>{' '}
                      {invoiceInfo.invoice_number || invoiceInfo.invoice_id}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600 }}>
                        Current seats_balance:
                      </span>{' '}
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
              border: `1px solid ${theme.borderColor ?? '#000000'}`,
              backgroundColor: seatEventLoading
                ? theme.backgroundColor ?? '#ffffff'
                : theme.primaryColor ?? '#000000',
              color: seatEventLoading
                ? theme.primaryColor ?? '#000000'
                : theme.mode === 'dark'
                  ? '#000000'
                  : '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: seatEventLoading ? 'default' : 'pointer',
              opacity: seatEventLoading ? 0.6 : 1,
            }}
          >
            {seatEventLoading ? 'Saving…' : 'Add Seat Event'}
          </button>
        </div>

        <div
          style={{
            backgroundColor: theme.backgroundColor ?? '#ffffff',
            borderRadius: '0.9rem',
            border: `1px solid ${
              theme.mode === 'dark' ? '#4b5563' : '#e5e7eb'
            }`,
            padding: '1.25rem 1.05rem 1.35rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.02rem',
              fontWeight: 600,
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
                fontSize: '0.9rem',
              }}
            >
              No seat events found.
            </div>
          ) : (
            <div
              style={{
                borderRadius: '0.75rem',
                border: `1px solid ${
                  theme.mode === 'dark' ? '#4b5563' : '#e5e7eb'
                }`,
                overflow: 'hidden',
                backgroundColor: theme.backgroundColor ?? '#ffffff',
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
                    backgroundColor: theme.mode === 'dark' ? '#020617' : '#ffffff',
                    borderBottom: `1px solid ${theme.borderColor ?? '#000000'}`,
                  }}
                >
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.6rem 0.9rem',
                        fontWeight: 600,
                      }}
                    >
                      Time
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.6rem 0.9rem',
                        fontWeight: 600,
                      }}
                    >
                      Customer
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.6rem 0.9rem',
                        fontWeight: 600,
                      }}
                    >
                      Seat Meter
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.6rem 0.9rem',
                        fontWeight: 600,
                      }}
                    >
                      Change
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.6rem 0.9rem',
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
                      connection.customers.find(
                        (c) => c.id === ev.customer_id,
                      ) ?? null;
                    const meter =
                      seatMeters.find((m) => m.id === ev.seat_meter_id) ??
                      null;
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
                          borderTop: `1px solid ${
                            theme.mode === 'dark' ? '#4b5563' : '#000000'
                          }`,
                          backgroundColor:
                            theme.backgroundColor ?? '#ffffff',
                        }}
                      >
                        <td
                          style={{
                            padding: '0.65rem 0.9rem',
                          }}
                        >
                          {date}
                        </td>
                        <td
                          style={{
                            padding: '0.65rem 0.9rem',
                          }}
                        >
                          {customer?.name || ev.customer_id}
                        </td>
                        <td
                          style={{
                            padding: '0.65rem 0.9rem',
                          }}
                        >
                          {meter?.name || ev.seat_meter_id}
                        </td>
                        <td
                          style={{
                            padding: '0.65rem 0.9rem',
                          }}
                        >
                          {changeText}
                        </td>
                        <td
                          style={{
                            padding: '0.65rem 0.9rem',
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


