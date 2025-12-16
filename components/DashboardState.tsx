'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

const SONIC_API_BASE =
  process.env.NEXT_PUBLIC_SONIC_API_BASE ?? 'http://localhost:8000';
const SONIC_API_KEY = process.env.NEXT_PUBLIC_SONIC_API_KEY ?? '';

export type SonicCustomer = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type SonicConnectionResponse = {
  connected: boolean;
  organization_id: string;
  organization_name: string;
  total_customers: number;
  customers: SonicCustomer[];
};

export type DashboardStats = {
  totalSchedules: number;
  activeSchedules: number;
  totalInvoices: number;
  paidInvoices: number;
};

export type DashboardContextValue = {
  loading: boolean;
  error: string | null;
  result: SonicConnectionResponse | null;
  stats: DashboardStats;
  hasLoaded: boolean;
  loadDashboard: (userEmail: string) => Promise<void>;
};

const DashboardContext = createContext<DashboardContextValue | undefined>(
  undefined,
);

export function DashboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SonicConnectionResponse | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalSchedules: 0,
    activeSchedules: 0,
    totalInvoices: 0,
    paidInvoices: 0,
  });
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadDashboard = useCallback(async (userEmail: string) => {
    if (!SONIC_API_KEY) {
      setError('Sonic API key is not configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch organization and customers
      const res = await fetch(
        `${SONIC_API_BASE}/api/integrations/api-keys/validate`,
        {
          headers: {
            'X-Sonic-Api-Key': SONIC_API_KEY,
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

      // Fetch stats from all customers' schedules
      let totalSchedules = 0;
      let activeSchedules = 0;
      let totalInvoices = 0;
      let paidInvoices = 0;

      for (const customer of data.customers) {
        try {
          const schedulesRes = await fetch(
            `${SONIC_API_BASE}/api/integrations/api-keys/customers/${customer.id}/schedules`,
            {
              headers: {
                'X-Sonic-Api-Key': SONIC_API_KEY,
                'X-User-Email': userEmail,
              },
            },
          );

          if (schedulesRes.ok) {
            const schedules = (await schedulesRes.json()) as any[];
            totalSchedules += schedules.length;
            activeSchedules += schedules.filter(
              (s: any) => s.status === 'active',
            ).length;

            // Count invoices for each schedule
            for (const schedule of schedules) {
              try {
                const invoicesRes = await fetch(
                  `${SONIC_API_BASE}/api/integrations/api-keys/schedules/${schedule.schedule_id}/invoices`,
                  {
                    headers: {
                      'X-Sonic-Api-Key': SONIC_API_KEY,
                      'X-User-Email': userEmail,
                    },
                  },
                );

                if (invoicesRes.ok) {
                  const invoices = (await invoicesRes.json()) as any[];
                  totalInvoices += invoices.length;
                  paidInvoices += invoices.filter((inv) => inv.is_paid).length;
                }
              } catch {
                // Skip if invoice fetch fails
              }
            }
          }
        } catch {
          // Skip if schedule fetch fails
        }
      }

      setStats({
        totalSchedules,
        activeSchedules,
        totalInvoices,
        paidInvoices,
      });
      setHasLoaded(true);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Unknown error while loading dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const value: DashboardContextValue = {
    loading,
    error,
    result,
    stats,
    hasLoaded,
    loadDashboard,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardState(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboardState must be used within a DashboardProvider');
  }
  return ctx;
}

