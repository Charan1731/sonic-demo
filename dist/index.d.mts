import * as react_jsx_runtime from 'react/jsx-runtime';

type SonicEnvironment = 'production' | 'staging' | 'development';
interface SonicClientConfig {
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
type SeatMeter = {
    id: string;
    name: string;
    description?: string | null;
    seat_type?: string | null;
    seat_type_id?: string | null;
    status?: string | null;
};
type SeatEventCreatePayload = {
    seat_meter_id: string;
    customer_id: string;
    event_type: 'added' | 'removed';
    seats_added?: number;
    seats_removed?: number;
    event_timestamp?: string;
};
type SeatInvoiceInfo = {
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

interface SonicUser {
    email: string;
    id?: string;
}
interface SonicTheme {
    mode?: 'light' | 'dark';
    primaryColor?: string;
    borderColor?: string;
    backgroundColor?: string;
}
interface SonicWidgetConfig {
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
interface SonicWidgetProps extends SonicWidgetConfig {
}
declare function SonicWidget(props: SonicWidgetProps): react_jsx_runtime.JSX.Element;

interface InitSonicWidgetConfig extends SonicWidgetConfig {
    /**
     * Target container where the widget trigger button will be rendered.
     * Can be a CSS selector or an HTMLElement.
     */
    target: string | HTMLElement;
}
interface SonicWidgetInstance {
    destroy: () => void;
}
declare function initSonicWidget(config: InitSonicWidgetConfig): SonicWidgetInstance;

export { type SeatEventCreatePayload, type SeatEventListItem, type SeatInvoiceInfo, type SeatMeter, type SonicClientConfig, type SonicConnectionResponse, type SonicEnvironment, type SonicTheme, type SonicUser, SonicWidget, type SonicWidgetConfig, type SonicWidgetProps, initSonicWidget };
