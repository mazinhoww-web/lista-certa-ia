// LC-008 — types shared by the cart strategies UI. The shapes here mirror
// what the build-cart Edge Function writes to public.cart_strategies and
// what the front renders.

export type CartStrategyName = "cheapest" | "fastest" | "recommended";
export type CartItemSource = "mercadolibre" | "kalunga_mock" | "magalu_mock";
export type CartItemStatus = "available" | "unavailable" | "partial_no_full";

export interface CartStrategyItem {
  list_item_id: string;
  list_item_name: string;
  source: CartItemSource;
  is_mock: boolean;
  ml_item_id: string | null;
  title: string | null;
  price_cents: number | null;
  seller_name: string | null;
  shipping_type: string | null;
  is_full: boolean;
  permalink: string | null;
  thumbnail: string | null;
  status: CartItemStatus;
}

export interface CartStrategy {
  id: string;
  student_id: string;
  list_id: string;
  strategy: CartStrategyName;
  items: CartStrategyItem[];
  total_cents: number;
  total_items: number;
  unavailable_items: number;
  has_partial_strategy: boolean;
  retailers_summary: Record<string, { count: number; total_cents: number }>;
  generated_at: string;
  expires_at: string;
}

export interface BuildCartResponse {
  strategies: CartStrategy[];
  cached: boolean;
}
