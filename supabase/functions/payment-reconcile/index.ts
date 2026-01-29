// @ts-ignore: Deno runtime import
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore: Deno runtime import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

/// <reference lib="deno.ns" />

// @ts-ignore: Deno runtime env
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore: Deno runtime env
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// @ts-ignore: Deno runtime env
const NOWPAYMENTS_API_KEY = Deno.env.get("NOWPAYMENTS_API_KEY") ?? "";
// @ts-ignore: Deno runtime env
const NOWPAYMENTS_BASE_URL = Deno.env.get("NOWPAYMENTS_BASE_URL") ?? "https://api.nowpayments.io/v1";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !NOWPAYMENTS_API_KEY) {
    return new Response("Missing config", { status: 500 });
  }

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const { data: payments, error } = await client
      .from("payments")
      .select("id, nowpayments_payment_id, pay_amount, status")
      .eq("status", "succeeded")
      .eq("reconciliation_status", "unreconciled");

    if (error) throw error;

    for (const payment of payments || []) {
      const response = await fetch(
        `${NOWPAYMENTS_BASE_URL}/payment/${payment.nowpayments_payment_id}`,
        { headers: { "x-api-key": NOWPAYMENTS_API_KEY } }
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const actuallyPaid = Number(data.actually_paid || 0);
      const expected = Number(payment.pay_amount || 0);
      const discrepancy = Number((actuallyPaid - expected).toFixed(8));

      const status = discrepancy === 0 ? "matched" : discrepancy > 0 ? "overpaid" : "underpaid";

      await client
        .from("payments")
        .update({
          reconciliation_status: status,
          discrepancy_amount: discrepancy,
        })
        .eq("id", payment.id);
    }

    return new Response(JSON.stringify({ ok: true, reconciled: payments?.length || 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Error", { status: 500 });
  }
});
