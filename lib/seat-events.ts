const SONIC_API_BASE =
  process.env.NEXT_PUBLIC_SONIC_API_BASE ?? 'http://localhost:8000';
const SONIC_API_KEY = process.env.NEXT_PUBLIC_SONIC_API_KEY ?? '';

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

function buildHeaders(userEmail: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-User-Email': userEmail,
  };

  if (SONIC_API_KEY) {
    headers['X-Sonic-Api-Key'] = SONIC_API_KEY;
  }

  return headers;
}

export async function fetchSeatMeters(
  userEmail: string,
): Promise<SeatMeter[]> {
  const res = await fetch(
    `${SONIC_API_BASE}/api/integrations/api-keys/seat/seat-meters?page_size=100`,
    {
      headers: buildHeaders(userEmail),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let errorMessage =
      text || `Failed to load seat meters (status ${res.status})`;

    try {
      const errorJson = JSON.parse(text);
      errorMessage = errorJson.detail || errorMessage;
    } catch {
      // Not JSON
    }

    throw new Error(errorMessage);
  }

  const data = await res.json();
  // Backend returns { meters: SeatMeter[], ... }
  if (Array.isArray(data?.meters)) {
    return data.meters as SeatMeter[];
  }

  return [];
}

export async function createSeatEvent(
  payload: SeatEventCreatePayload,
  userEmail: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${SONIC_API_BASE}/api/integrations/api-keys/seat/seat-events`, {
    method: 'POST',
    headers: buildHeaders(userEmail),
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => '');

  if (!res.ok) {
    let errorMessage =
      text || `Failed to create seat event (status ${res.status})`;

    try {
      const errorJson = JSON.parse(text);
      errorMessage = errorJson.detail || errorMessage;
    } catch {
      // Not JSON
    }

    throw new Error(errorMessage);
  }

  return (text ? JSON.parse(text) : {}) as Record<string, unknown>;
}

export async function fetchSeatInvoiceForEvent(
  customerId: string,
  seatTypeId: string,
  eventTimestamp: string | null,
  userEmail: string,
): Promise<SeatInvoiceInfo | null> {
  const params = new URLSearchParams({
    customer_id: customerId,
    seat_type_id: seatTypeId,
  });

  if (eventTimestamp) {
    params.append('event_timestamp', eventTimestamp);
  }

  const res = await fetch(
    `${SONIC_API_BASE}/api/integrations/api-keys/seat/seat-events/invoices/by-customer-seat-type?${params.toString()}`,
    {
      headers: buildHeaders(userEmail),
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

