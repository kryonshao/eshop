// @ts-ignore: Deno runtime import
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore: Deno runtime import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

/// <reference lib="deno.ns" />

// @ts-ignore: Deno runtime env
const NOWPAYMENTS_API_KEY = Deno.env.get("NOWPAYMENTS_API_KEY") ?? "";
// @ts-ignore: Deno runtime env
const NOWPAYMENTS_BASE_URL = Deno.env.get("NOWPAYMENTS_BASE_URL") ?? "https://api.nowpayments.io/v1";
// @ts-ignore: Deno runtime env
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore: Deno runtime env
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

type RefundRequest = {
  paymentId: string;
  amountUSD: number;
  payAddress: string;
};

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!NOWPAYMENTS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Missing NOWPayments config", { status: 500 });
  }

  try {
    const body = (await req.json()) as RefundRequest;
    if (!body?.paymentId || !body?.amountUSD || !body?.payAddress) {
      return new Response("Invalid request", { status: 400 });
    }

    const response = await fetch(`${NOWPAYMENTS_BASE_URL}/payment/${body.paymentId}/refund`, {
      method: "POST",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: body.amountUSD,
        currency: "usd",
        pay_address: body.payAddress,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(`NOWPayments error: ${errorText}`, { status: 502 });
    }

    const data = await response.json();

    const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: paymentRow } = await client
      .from("payments")
      .select("id")
      .eq("nowpayments_payment_id", body.paymentId)
      .maybeSingle();

    if (paymentRow?.id) {
      await client
        .from("refunds")
        .insert({
          payment_id: paymentRow.id,
          amount_usd: body.amountUSD,
          crypto_amount: Number(data?.amount || 0),
          crypto_currency: data?.currency || "usdt",
          exchange_rate: Number(data?.exchange_rate || 0),
          reason: "manual_refund",
          status: "processing",
          nowpayments_refund_id: data?.refund_id?.toString?.() ?? null,
          processed_at: new Date().toISOString(),
        });
    }

    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error(error);
    return new Response("Internal Error", { status: 500 });
  }
});
