const SONIC_API_BASE =
  process.env.NEXT_PUBLIC_SONIC_API_BASE ?? 'http://localhost:8000';
const SONIC_API_KEY = process.env.NEXT_PUBLIC_SONIC_API_KEY ?? '';

export type PhaseProduct = {
  product_id: string;
  product_name?: string | null;
  quantity?: number | null;
  price_base?: number | null;
  discount_percentage?: number | null;
  billing_frequency?: string | null;
  currency_code?: string | null;
};

export type Phase = {
  phase_number: number;
  name?: string | null;
  start_date: string;
  end_date: string;
  products: PhaseProduct[];
  phase_discount_percentage?: number | null;
  phase_discount_fixed?: number | null;
};

export type ScheduleDetails = {
  schedule_id: string;
  billing_schedule_label?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  duration?: string | null;
  billing_day?: string | null;
  currency_code?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  contract_id?: string | null;
  contract_name?: string | null;
  phases: Phase[];
};

export type Invoice = {
  invoice_id: string;
  invoice_number?: string | null;
  status: string;
  schedule_id?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  amount_subtotal: number;
  amount_discount: number;
  amount_tax: number;
  amount_total: number;
  currency: string;
  invoice_date?: string | null;
  due_date?: string | null;
  paid_at?: string | null;
  is_paid: boolean;
  created_at?: string | null;
};

async function getApiHeaders(userEmail: string): Promise<HeadersInit> {
  return {
    'X-Sonic-Api-Key': SONIC_API_KEY,
    'X-User-Email': userEmail,
  };
}

export async function fetchScheduleDetails(
  scheduleId: string,
  userEmail: string,
): Promise<ScheduleDetails> {
  const res = await fetch(
    `${SONIC_API_BASE}/api/integrations/api-keys/schedules/${scheduleId}`,
    {
      headers: await getApiHeaders(userEmail),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let errorMessage = text || `Failed to fetch schedule details (status ${res.status})`;

    try {
      const errorJson = JSON.parse(text);
      errorMessage = errorJson.detail || errorMessage;
    } catch {
      // Not JSON, use text as is
    }

    throw new Error(errorMessage);
  }

  return (await res.json()) as ScheduleDetails;
}

export async function fetchScheduleInvoices(
  scheduleId: string,
  userEmail: string,
): Promise<Invoice[]> {
  const res = await fetch(
    `${SONIC_API_BASE}/api/integrations/api-keys/schedules/${scheduleId}/invoices`,
    {
      headers: await getApiHeaders(userEmail),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let errorMessage = text || `Failed to fetch invoices (status ${res.status})`;

    try {
      const errorJson = JSON.parse(text);
      errorMessage = errorJson.detail || errorMessage;
    } catch {
      // Not JSON, use text as is
    }

    throw new Error(errorMessage);
  }

  return (await res.json()) as Invoice[];
}

