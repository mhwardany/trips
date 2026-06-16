export type Role = 'owner' | 'manager' | 'family';

export interface User { id: string; username: string; display_name: string; role: Role; }
export interface Profile { id: string; name: string; whatsapp: string; }

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data: T;
  error: { code: string; message: string } | null;
  meta: unknown;
}

export interface Trip {
  id: string; name: string; type: string; origin_country: string; is_round_trip: boolean; base_currency: string; country: string; city: string;
  airport: string; airline: string; flight_no: string;
  depart_date: string; return_date: string; hotel: string; address: string;
  contacts: string; emergency: string; currency_code: string;
  snapshot_rate: number; budget_total: number; status: 'active' | 'archived'; notes: string;
}

export interface FamilyRequest {
  id: string; trip_id: string; requester_user_id: string; requester_name: string;
  group_name: string; item_name: string; link: string; image_file_id: string;
  priority: 'low' | 'medium' | 'high'; status: string; notes: string;
}

export interface ShoppingItem {
  id: string; trip_id: string; group_name: string; request_id: string; client_order_id: string;
  item: string; qty: number; est_price: number; actual_price: number;
  currency: string; actual_currency: string; store: string; photo_file_id: string; requester: string;
  purchased: boolean | string; delivered: boolean | string; in_cart: boolean | string; notes: string;
}

export interface Gift {
  id: string; trip_id: string; requested_by: string; recipient: string;
  item: string; qty: number; est_cost: number; actual_cost: number;
  purchase_date: string; delivery_date: string; delivery_status: string;
}

export interface Expense {
  id: string; trip_id: string; category: string; amount: number; currency: string;
  amount_egp: number; rate_used: number; date: string; store: string;
  receipt_file_id: string; payment_method: string; notes: string;
}

export interface DashboardData {
  trip: Trip | null;
  widgets: {
    days_to_departure: number; days_to_return: number; open_requests: number;
    gifts_purchased: number; gifts_total: number;
    budget_total: number; budget_spent: number; budget_remaining: number;
    shopping_done: number; shopping_total: number;
    packing_done: number; packing_total: number;
    documents_count: number; checklist_done: number; checklist_total: number;
  };
  budget_intel: { daily_limit: number; burn_rate: number; forecast_total: number; on_track: boolean };
  charts: { by_category: Record<string, number>; by_day: Record<string, number> };
  envelopes: { category: string; amount: number; spent: number }[];
  currency: { code: string; snapshot_rate: number };
}

export interface GenericRecord { id: string; [key: string]: unknown; }

export const REQUEST_STATUSES = ['requested','planned','searching','available','purchased','packed','delivered','closed'] as const;
export const EXPENSE_CATEGORIES = ['flight','hotel','food','transportation','shopping','gifts','entertainment','emergency','other'] as const;
export const PACKING_CATEGORIES = ['clothes','electronics','documents','gifts','personal','medicines'] as const;
export const CHECKLIST_PHASES = ['before_travel','during_travel','before_return','after_return'] as const;
export const CONTACT_CATEGORIES = ['family','friends','kuwait','emergency'] as const;
export const TRIP_TYPES = ['business','family','shopping','medical','personal','custom'] as const;
