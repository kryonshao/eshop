// @ts-ignore: Deno runtime import
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore: Deno runtime import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

/// <reference lib="deno.ns" />

// @ts-ignore: Deno runtime env
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore: Deno runtime env
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Missing Supabase config", { status: 500 });
  }

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const { data: failedPayments } = await client
      .from("payments")
      .select("id")
      .eq("status", "failed")
      .gte("created_at", since);

    const { data: webhookEvents } = await client
      .from("nowpayments_webhook_events")
      .select("id")
      .gte("received_at", since);

    await client.from("system_events").insert({
      event_type: "daily_metrics",
      severity: "info",
      source: "audit-metrics",
      payload: {
        window_since: since,
        failed_payments: failedPayments?.length || 0,
        webhook_events: webhookEvents?.length || 0,
      },
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Error", { status: 500 });
  }
});
