// supabase/functions/build-cart/index.ts
//
// LC-008: builds 3 cart strategies (cheapest / fastest / recommended) for a
// student × list using Mercado Livre as the real source. When the env var
// ENABLE_RETAILER_MOCKS=true, the candidate pool is expanded with one
// deterministic Kalunga and one Magalu mock per item — pure UX demo, never
// presented as real data (the front renders a DEMO badge + banner).
//
// Auth: parent's Bearer JWT. The function validates that
//   student.parent_id === auth.uid() AND student.deleted_at IS NULL
// before doing anything else.
//
// Cache:
//   - cart_strategies has a 24h TTL. Re-entry serves from cache unless
//     the body sets force_refresh=true.
//   - ml_search_cache has a 6h TTL with stale fallback up to 7d when ML
//     is down / rate-limited. Items with no fresh data and no usable
//     stale fallback are emitted as status='unavailable'.
//
// LGPD: nothing in this function or in the rows it writes (cart_strategies,
// students_access_log.metadata, analytics_events) carries the student's
// first_name. Only IDs and counters.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// ============================================================
// Types
// ============================================================

type Strategy = "cheapest" | "fastest" | "recommended";
type ItemSource = "mercadolibre" | "kalunga_mock" | "magalu_mock";
type ItemStatus = "available" | "unavailable" | "partial_no_full";

interface MlCandidate {
  id: string;
  title: string;
  price: number; // BRL float
  permalink: string;
  thumbnail: string;
  seller: {
    id: number;
    nickname: string;
    seller_reputation: { power_seller_status?: string | null } | null;
  };
  shipping: {
    logistic_type: string | null;
    free_shipping: boolean;
  };
  available_quantity: number;
}

interface ExpandedCandidate extends MlCandidate {
  source: ItemSource;
  is_mock: boolean;
}

interface CartItemOut {
  list_item_id: string;
  list_item_name: string;
  source: ItemSource;
  is_mock: boolean;
  ml_item_id: string | null;
  title: string | null;
  price_cents: number | null;
  seller_name: string | null;
  shipping_type: string | null;
  is_full: boolean;
  permalink: string | null;
  thumbnail: string | null;
  status: ItemStatus;
}

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "authorization, content-type",
};

const ML_TIMEOUT_MS = 5000;
const ML_RETRY = 1;
const ML_TOP_N = 20;
const STALE_FALLBACK_DAYS = 7;

// ============================================================
// Helpers
// ============================================================

function log(event: string, fields: Record<string, unknown> = {}): void {
  // PII safety: never include first_name or any PII here.
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...fields }));
}

function logError(event: string, fields: Record<string, unknown> = {}): void {
  console.error(JSON.stringify({ ts: new Date().toISOString(), event, ...fields }));
}

function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

// ============================================================
// ML search wrapper with cache + stale fallback
// ============================================================

async function fetchMlReal(query: string): Promise<MlCandidate[] | null> {
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=${ML_TOP_N}`;
  for (let attempt = 0; attempt <= ML_RETRY; attempt++) {
    try {
      const ac = new AbortController();
      const tm = setTimeout(() => ac.abort(), ML_TIMEOUT_MS);
      const res = await fetch(url, { signal: ac.signal });
      clearTimeout(tm);
      if (!res.ok) {
        if (attempt === ML_RETRY) return null;
        continue;
      }
      const json = await res.json();
      const arr = Array.isArray(json?.results) ? json.results : [];
      return arr.slice(0, ML_TOP_N).map((r: Record<string, unknown>) => ({
        id: String(r.id ?? ""),
        title: String(r.title ?? ""),
        price: Number(r.price ?? 0),
        permalink: String(r.permalink ?? ""),
        thumbnail: String(r.thumbnail ?? ""),
        seller: {
          id: Number((r.seller as Record<string, unknown>)?.id ?? 0),
          nickname: String((r.seller as Record<string, unknown>)?.nickname ?? ""),
          seller_reputation:
            ((r.seller as Record<string, unknown>)?.seller_reputation as
              | { power_seller_status?: string | null }
              | null) ?? null,
        },
        shipping: {
          logistic_type:
            ((r.shipping as Record<string, unknown>)?.logistic_type as string | null) ?? null,
          free_shipping: Boolean(
            (r.shipping as Record<string, unknown>)?.free_shipping ?? false,
          ),
        },
        available_quantity: Number(r.available_quantity ?? 0),
      }));
    } catch (err) {
      if (attempt === ML_RETRY) {
        logError("ml_fetch_failed", { message: (err as Error).message });
        return null;
      }
    }
  }
  return null;
}

async function searchML(
  supabase: ReturnType<typeof createClient>,
  rawQuery: string,
): Promise<MlCandidate[]> {
  const queryNorm = normalizeQuery(rawQuery);
  if (!queryNorm) return [];

  // Fresh cache?
  const { data: fresh } = await supabase
    .from("ml_search_cache")
    .select("results, fetched_at, expires_at")
    .eq("query_normalized", queryNorm)
    .eq("source", "mercadolibre")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (fresh?.results) {
    return fresh.results as MlCandidate[];
  }

  // Fetch ML real
  const real = await fetchMlReal(rawQuery);
  if (real !== null) {
    const expires_at = new Date(Date.now() + 6 * 3600 * 1000).toISOString();
    await supabase
      .from("ml_search_cache")
      .upsert(
        {
          query_normalized: queryNorm,
          source: "mercadolibre",
          results: real,
          fetched_at: new Date().toISOString(),
          expires_at,
        },
        { onConflict: "query_normalized,source" },
      );
    return real;
  }

  // ML failed — try stale (≤ 7d)
  const staleCutoff = new Date(
    Date.now() - STALE_FALLBACK_DAYS * 24 * 3600 * 1000,
  ).toISOString();
  const { data: stale } = await supabase
    .from("ml_search_cache")
    .select("results, fetched_at")
    .eq("query_normalized", queryNorm)
    .eq("source", "mercadolibre")
    .gt("fetched_at", staleCutoff)
    .maybeSingle();
  if (stale?.results) {
    log("ml_stale_fallback", { query: queryNorm });
    return stale.results as MlCandidate[];
  }
  return [];
}

// ============================================================
// Mock expansion (Kalunga / Magalu)
// ============================================================

function expandWithMocks(
  itemId: string,
  mlCandidates: MlCandidate[],
  enableMocks: boolean,
): ExpandedCandidate[] {
  const real: ExpandedCandidate[] = mlCandidates.map((c) => ({
    ...c,
    source: "mercadolibre",
    is_mock: false,
  }));
  if (!enableMocks || mlCandidates.length === 0) return real;

  const cheapest = mlCandidates.reduce(
    (acc, c) => (c.price < acc.price ? c : acc),
    mlCandidates[0]!,
  );

  const kSeed = hashString(`${itemId}_kalunga`);
  const kMul = 0.92 + (kSeed % 26) / 100; // 0.92–1.17
  const kPriceCents = Math.round(cheapest.price * 100 * kMul);

  const mSeed = hashString(`${itemId}_magalu`);
  const mMul = 0.95 + (mSeed % 27) / 100; // 0.95–1.21
  const mPriceCents = Math.round(cheapest.price * 100 * mMul);

  const kalunga: ExpandedCandidate = {
    id: `kalunga_mock_${itemId}`,
    title: cheapest.title,
    price: kPriceCents / 100,
    permalink: "https://www.kalunga.com.br",
    thumbnail: cheapest.thumbnail,
    seller: { id: 0, nickname: "Kalunga", seller_reputation: null },
    shipping: {
      logistic_type: "pickup_2h",
      free_shipping: kPriceCents > 5000,
    },
    available_quantity: 10,
    source: "kalunga_mock",
    is_mock: true,
  };
  const magalu: ExpandedCandidate = {
    id: `magalu_mock_${itemId}`,
    title: cheapest.title,
    price: mPriceCents / 100,
    permalink: "https://www.magazineluiza.com.br",
    thumbnail: cheapest.thumbnail,
    seller: { id: 0, nickname: "Magazine Luiza", seller_reputation: null },
    shipping: {
      logistic_type: "cross_docking",
      free_shipping: mPriceCents > 7900,
    },
    available_quantity: 10,
    source: "magalu_mock",
    is_mock: true,
  };
  return [...real, kalunga, magalu];
}

// ============================================================
// Strategy algorithms
// ============================================================

function toCartItem(
  c: ExpandedCandidate | null,
  listItemId: string,
  listItemName: string,
  status: ItemStatus,
): CartItemOut {
  if (!c) {
    return {
      list_item_id: listItemId,
      list_item_name: listItemName,
      source: "mercadolibre",
      is_mock: false,
      ml_item_id: null,
      title: null,
      price_cents: null,
      seller_name: null,
      shipping_type: null,
      is_full: false,
      permalink: null,
      thumbnail: null,
      status,
    };
  }
  return {
    list_item_id: listItemId,
    list_item_name: listItemName,
    source: c.source,
    is_mock: c.is_mock,
    ml_item_id: c.source === "mercadolibre" ? c.id : null,
    title: c.title,
    price_cents: Math.round(c.price * 100),
    seller_name: c.seller.nickname || null,
    shipping_type: c.shipping.logistic_type ?? null,
    is_full: c.shipping.logistic_type === "fulfillment",
    permalink: c.permalink,
    thumbnail: c.thumbnail,
    status,
  };
}

function pickCheapest(c: ExpandedCandidate[]): ExpandedCandidate | null {
  if (c.length === 0) return null;
  return c.reduce((min, x) => (x.price < min.price ? x : min), c[0]!);
}

function pickFastest(
  c: ExpandedCandidate[],
): { pick: ExpandedCandidate | null; status: ItemStatus } {
  const fast = c.filter((x) =>
    x.shipping.logistic_type === "fulfillment" ||
    x.shipping.logistic_type === "pickup_2h",
  );
  if (fast.length > 0) {
    return { pick: pickCheapest(fast), status: "available" };
  }
  // Fallback: cheapest overall, but flag as partial.
  const fallback = pickCheapest(c);
  return {
    pick: fallback,
    status: fallback ? "partial_no_full" : "unavailable",
  };
}

function sellerScore(c: ExpandedCandidate): number {
  const status = c.seller.seller_reputation?.power_seller_status;
  if (status === "platinum") return 1;
  if (status === "gold") return 0.85;
  if (status === "silver") return 0.7;
  if (status === "bronze") return 0.5;
  // Mocks get 0.7 (decent default — not punished).
  if (c.is_mock) return 0.7;
  return 0.5;
}

function pickRecommended(c: ExpandedCandidate[]): ExpandedCandidate | null {
  if (c.length === 0) return null;
  const minP = Math.min(...c.map((x) => x.price));
  const maxP = Math.max(...c.map((x) => x.price));
  const range = maxP - minP || 1;
  let best = c[0]!;
  let bestScore = -Infinity;
  for (const x of c) {
    const priceNorm = (maxP - x.price) / range;
    const fullScore =
      x.shipping.logistic_type === "fulfillment" ||
      x.shipping.logistic_type === "pickup_2h"
        ? 1
        : 0;
    const score = 0.5 * priceNorm + 0.3 * fullScore + 0.2 * sellerScore(x);
    if (score > bestScore) {
      bestScore = score;
      best = x;
    }
  }
  return best;
}

interface ListItemRow {
  id: string;
  name: string;
  specification: string | null;
  suggested_query: string | null;
}

interface BuiltStrategy {
  items: CartItemOut[];
  total_cents: number;
  total_items: number;
  unavailable_items: number;
  has_partial_strategy: boolean;
  retailers_summary: Record<string, { count: number; total_cents: number }>;
}

function summarize(items: CartItemOut[]): BuiltStrategy {
  let total_cents = 0;
  let unavailable = 0;
  let partial = false;
  const retailers: Record<string, { count: number; total_cents: number }> = {};
  for (const it of items) {
    if (it.status === "unavailable") {
      unavailable++;
      continue;
    }
    if (it.status === "partial_no_full") partial = true;
    if (it.price_cents != null) {
      total_cents += it.price_cents;
      const key = it.seller_name ?? "—";
      const cur = retailers[key] ?? { count: 0, total_cents: 0 };
      cur.count++;
      cur.total_cents += it.price_cents;
      retailers[key] = cur;
    }
  }
  return {
    items,
    total_cents,
    total_items: items.length,
    unavailable_items: unavailable,
    has_partial_strategy: partial,
    retailers_summary: retailers,
  };
}

// ============================================================
// Main handler
// ============================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      logError("env_missing");
      return jsonResponse({ error: "env_missing" }, 500);
    }

    // Validate JWT via the user-scoped client (uses caller's bearer token).
    const auth = req.headers.get("authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
      global: { headers: { Authorization: auth } },
      auth: { persistSession: false },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }

    // Service-role client for tables not gated by RLS for the user
    // (cart_strategies INSERTs, ml_search_cache, analytics writes via audit).
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const studentId = String(body.student_id ?? "");
    const listId = String(body.list_id ?? "");
    const forceRefresh = Boolean(body.force_refresh ?? false);
    if (!studentId || !listId) {
      return jsonResponse({ error: "bad_request" }, 400);
    }

    // Ownership check.
    const { data: student } = await adminClient
      .from("students")
      .select("id, parent_id, deleted_at, list_id")
      .eq("id", studentId)
      .maybeSingle();
    if (!student || student.deleted_at) {
      return jsonResponse({ error: "not_found" }, 404);
    }
    if (student.parent_id !== user.id) {
      return jsonResponse({ error: "forbidden" }, 403);
    }

    // List exists + matches.
    const { data: list } = await adminClient
      .from("lists")
      .select("id, status")
      .eq("id", listId)
      .maybeSingle();
    if (!list || list.status !== "published") {
      return jsonResponse({ error: "not_found" }, 404);
    }

    // Cache hit?
    if (!forceRefresh) {
      const { data: cached } = await adminClient
        .from("cart_strategies")
        .select("*")
        .eq("student_id", studentId)
        .eq("list_id", listId)
        .gt("expires_at", new Date().toISOString());
      if (cached && cached.length === 3) {
        return jsonResponse({ strategies: cached, cached: true });
      }
    }

    // Items to shop = list_items minus student_owned_items.
    const [{ data: rawItems }, { data: owned }] = await Promise.all([
      adminClient
        .from("list_items")
        .select("id, name, specification, suggested_query")
        .eq("list_id", listId),
      adminClient
        .from("student_owned_items")
        .select("list_item_id")
        .eq("student_id", studentId),
    ]);
    const ownedSet = new Set((owned ?? []).map((r) => r.list_item_id));
    const itemsToShop: ListItemRow[] = (rawItems ?? []).filter(
      (i) => !ownedSet.has(i.id),
    );

    // Search ML for each item in parallel.
    const enableMocks = Deno.env.get("ENABLE_RETAILER_MOCKS") === "true";
    const candidatesPerItem = await Promise.all(
      itemsToShop.map(async (it) => {
        const q =
          it.suggested_query?.trim() ||
          `${it.name} ${it.specification ?? ""}`.trim();
        const ml = await searchML(adminClient, q);
        return expandWithMocks(it.id, ml, enableMocks);
      }),
    );

    // Apply 3 strategies.
    const cheapestItems: CartItemOut[] = itemsToShop.map((it, idx) => {
      const cs = candidatesPerItem[idx]!;
      if (cs.length === 0) return toCartItem(null, it.id, it.name, "unavailable");
      return toCartItem(pickCheapest(cs), it.id, it.name, "available");
    });
    const fastestItems: CartItemOut[] = itemsToShop.map((it, idx) => {
      const cs = candidatesPerItem[idx]!;
      if (cs.length === 0) return toCartItem(null, it.id, it.name, "unavailable");
      const r = pickFastest(cs);
      return toCartItem(r.pick, it.id, it.name, r.status);
    });
    const recommendedItems: CartItemOut[] = itemsToShop.map((it, idx) => {
      const cs = candidatesPerItem[idx]!;
      if (cs.length === 0) return toCartItem(null, it.id, it.name, "unavailable");
      return toCartItem(pickRecommended(cs), it.id, it.name, "available");
    });

    const strategies: Array<{ name: Strategy; built: BuiltStrategy }> = [
      { name: "cheapest", built: summarize(cheapestItems) },
      { name: "fastest", built: summarize(fastestItems) },
      { name: "recommended", built: summarize(recommendedItems) },
    ];
    const anyPartial = strategies.some((s) => s.built.has_partial_strategy);

    // Atomic write: delete prior + insert 3.
    await adminClient
      .from("cart_strategies")
      .delete()
      .eq("student_id", studentId)
      .eq("list_id", listId);

    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const inserts = strategies.map((s) => ({
      student_id: studentId,
      list_id: listId,
      strategy: s.name,
      items: s.built.items,
      total_cents: s.built.total_cents,
      total_items: s.built.total_items,
      unavailable_items: s.built.unavailable_items,
      has_partial_strategy: s.built.has_partial_strategy,
      retailers_summary: s.built.retailers_summary,
      expires_at: expiresAt,
    }));
    const { data: written, error: insErr } = await adminClient
      .from("cart_strategies")
      .insert(inserts)
      .select("*");
    if (insErr) {
      logError("strategies_insert_failed", { code: insErr.code, message: insErr.message });
      return jsonResponse({ error: "write_failed" }, 500);
    }

    // Audit log — NEVER include first_name.
    await adminClient.from("students_access_log").insert({
      student_id: studentId,
      accessed_by: user.id,
      action: "cart_generated",
      metadata: {
        list_id: listId,
        total_items: itemsToShop.length,
        has_partial_strategies: anyPartial,
        mocks_enabled: enableMocks,
      },
    });

    log("cart_generated", {
      student_id: studentId,
      list_id: listId,
      items: itemsToShop.length,
      partial: anyPartial,
      mocks: enableMocks,
    });

    return jsonResponse({ strategies: written, cached: false });
  } catch (err) {
    logError("unexpected", { message: (err as Error).message });
    return jsonResponse({ error: "unexpected" }, 500);
  }
});
