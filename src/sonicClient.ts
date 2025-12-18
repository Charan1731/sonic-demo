export type SonicEnvironment = 'production' | 'staging' | 'development';

export interface SonicClientConfig {
  apiKey: string;
  /**
   * Optional explicit base URL. If provided, this takes precedence over env.
   */
  baseUrl?: string;
  /**
   * Optional environment flag that can be mapped to a base URL.
   * Defaults to 'development'.
   */
  env?: SonicEnvironment;
}

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

export type SeatMeter = {
  id: string;
  name: string;
  description?: string | null;
  seat_type?: string | null;
  seat_type_id?: string | null;
  status?: string | null;
};

export type SeatEventCreatePayload = {
  seat_meter_id: string;
  customer_id: string;
  event_type: 'added' | 'removed';
  seats_added?: number;
  seats_removed?: number;
  event_timestamp?: string;
};

export type SeatInvoiceInfo = {
  invoice_id?: string;
  invoice_number?: string;
  product_id?: string;
  seat_type_id?: string;
  seat_meter_id?: string | null;
  seats_balance?: number | null;
  minimum_seats?: number | null;
  billing_period_start?: string | null;
  billing_period_end?: string | null;
};

export type SeatEventListItem = {
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

export type SonicSchedule = {
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

function resolveBaseUrl(config: SonicClientConfig): string {
  if (config.baseUrl) return config.baseUrl;

  const env = config.env ?? 'development';

  switch (env) {
    case 'production':
      // Default production base; the host app can override via baseUrl if needed.
      return 'https://api.sonicbilling.com';
    case 'staging':
      return 'https://staging-api.sonicbilling.com';
    case 'development':
    default:
      return 'http://localhost:8000';
  }
}

function buildHeaders(config: SonicClientConfig, userEmail: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-User-Email': userEmail,
  };

  if (config.apiKey) {
    headers['X-Sonic-Api-Key'] = config.apiKey;
  }

  return headers;
}

async function handleResponse(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  if (res.ok) {
    return text;
  }

  let errorMessage = text || `Request failed (status ${res.status})`;

  try {
    const errorJson = JSON.parse(text);
    errorMessage = errorJson.detail || errorMessage;
  } catch {
    // Not JSON, ignore
  }

  throw new Error(errorMessage);
}

export async function validateConnection(
  config: SonicClientConfig,
  userEmail: string,
): Promise<SonicConnectionResponse> {
  if (!config.apiKey) {
    throw new Error('Sonic API key is required to initialize the widget.');
  }

  const baseUrl = resolveBaseUrl(config);

  const res = await fetch(`${baseUrl}/api/integrations/api-keys/validate`, {
    headers: {
      'X-Sonic-Api-Key': config.apiKey,
      'X-User-Email': userEmail,
    },
  });

  const text = await handleResponse(res);
  return (text ? JSON.parse(text) : null) as SonicConnectionResponse;
}

export async function fetchSeatMeters(
  config: SonicClientConfig,
  userEmail: string,
): Promise<SeatMeter[]> {
  const baseUrl = resolveBaseUrl(config);

  const res = await fetch(
    `${baseUrl}/api/integrations/api-keys/seat/seat-meters?page_size=100`,
    {
      headers: buildHeaders(config, userEmail),
    },
  );

  const text = await handleResponse(res);
  const data = text ? JSON.parse(text) : null;

  if (Array.isArray(data?.meters)) {
    return data.meters as SeatMeter[];
  }

  return [];
}

export async function createSeatEvent(
  config: SonicClientConfig,
  payload: SeatEventCreatePayload,
  userEmail: string,
): Promise<Record<string, unknown>> {
  const baseUrl = resolveBaseUrl(config);

  const res = await fetch(
    `${baseUrl}/api/integrations/api-keys/seat/seat-events`,
    {
      method: 'POST',
      headers: buildHeaders(config, userEmail),
      body: JSON.stringify(payload),
    },
  );

  const text = await handleResponse(res);
  return (text ? JSON.parse(text) : {}) as Record<string, unknown>;
}

export async function fetchSeatEvents(
  config: SonicClientConfig,
  userEmail: string,
): Promise<SeatEventListItem[]> {
  const baseUrl = resolveBaseUrl(config);

  const res = await fetch(
    `${baseUrl}/api/integrations/api-keys/seat/seat-events?page_size=100`,
    {
      headers: buildHeaders(config, userEmail),
    },
  );

  const text = await handleResponse(res);
  const data = text ? JSON.parse(text) : null;
  const list = (data?.events || []) as SeatEventListItem[];
  return Array.isArray(list) ? list : [];
}

export async function fetchCustomerSchedules(
  config: SonicClientConfig,
  customerId: string,
  userEmail: string,
): Promise<SonicSchedule[]> {
  const baseUrl = resolveBaseUrl(config);

  const res = await fetch(
    `${baseUrl}/api/integrations/api-keys/customers/${customerId}/schedules`,
    {
      headers: buildHeaders(config, userEmail),
    },
  );

  const text = await handleResponse(res);
  const data = text ? JSON.parse(text) : [];
  return Array.isArray(data) ? (data as SonicSchedule[]) : [];
}

export async function fetchDashboardStats(
  config: SonicClientConfig,
  connection: SonicConnectionResponse,
  userEmail: string,
): Promise<DashboardStats> {
  let totalSchedules = 0;
  let activeSchedules = 0;
  let totalInvoices = 0;
  let paidInvoices = 0;

  const baseUrl = resolveBaseUrl(config);

  for (const customer of connection.customers) {
    try {
      const schedulesRes = await fetch(
        `${baseUrl}/api/integrations/api-keys/customers/${customer.id}/schedules`,
        {
          headers: buildHeaders(config, userEmail),
        },
      );

      if (!schedulesRes.ok) continue;

      const schedules = (await schedulesRes.json()) as SonicSchedule[];
      totalSchedules += schedules.length;
      activeSchedules += schedules.filter(
        (s: SonicSchedule) => s.status === 'active',
      ).length;

      for (const schedule of schedules) {
        try {
          const invoicesRes = await fetch(
            `${baseUrl}/api/integrations/api-keys/schedules/${schedule.schedule_id}/invoices`,
            {
              headers: buildHeaders(config, userEmail),
            },
          );

          if (!invoicesRes.ok) continue;

          const invoices = (await invoicesRes.json()) as {
            is_paid?: boolean;
          }[];
          totalInvoices += invoices.length;
          paidInvoices += invoices.filter((inv) => inv.is_paid).length;
        } catch {
          // ignore per-schedule invoice failures
        }
      }
    } catch {
      // ignore per-customer schedule failures
    }
  }

  return {
    totalSchedules,
    activeSchedules,
    totalInvoices,
    paidInvoices,
  };
}

export async function fetchSeatInvoiceForEvent(
  config: SonicClientConfig,
  customerId: string,
  seatTypeId: string,
  eventTimestamp: string | null,
  userEmail: string,
): Promise<SeatInvoiceInfo | null> {
  const baseUrl = resolveBaseUrl(config);

  const params = new URLSearchParams({
    customer_id: customerId,
    seat_type_id: seatTypeId,
  });

  if (eventTimestamp) {
    params.append('event_timestamp', eventTimestamp);
  }

  const res = await fetch(
    `${baseUrl}/api/integrations/api-keys/seat/seat-events/invoices/by-customer-seat-type?${params.toString()}`,
    {
      headers: buildHeaders(config, userEmail),
    },
  );

  const text = await res.text().catch(() => '');

  if (res.status === 404) {
    // No matching invoice for this combination; not an error for the UI
    return null;
  }

  if (!res.ok) {
    let errorMessage =
      text || `Failed to load invoice for seat event (status ${res.status})`;

    try {
      const errorJson = JSON.parse(text);
      errorMessage = errorJson.detail || errorMessage;
    } catch {
      // Not JSON
    }

    throw new Error(errorMessage);
  }

  try {
    return (text ? JSON.parse(text) : null) as SeatInvoiceInfo | null;
  } catch {
    return null;
  }
}


