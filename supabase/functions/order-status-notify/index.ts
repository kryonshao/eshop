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
const NOTIFY_FUNCTION_URL = Deno.env.get("NOTIFY_FUNCTION_URL") ?? "";
// @ts-ignore: Deno runtime env
const NOTIFY_FUNCTION_KEY = Deno.env.get("NOTIFY_FUNCTION_KEY") ?? "";

const statusSubjectMap: Record<string, string> = {
  pending: "订单已创建",
  paid: "订单已支付",
  shipped: "订单已发货",
  delivered: "订单已送达",
  cancelled: "订单已取消",
};

const buildHtml = (orderId: string, status: string) => {
  return `<p>订单 <strong>${orderId}</strong> 状态更新为：<strong>${status}</strong></p>`;
};

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !NOTIFY_FUNCTION_URL || !NOTIFY_FUNCTION_KEY) {
    return new Response("Missing config", { status: 500 });
  }

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const { orderId, status } = (await req.json()) as { orderId: string; status: string };
    if (!orderId || !status) {
      return new Response("Invalid request", { status: 400 });
    }

    const { data: order, error } = await client
      .from("orders")
      .select("guest_email, user_id")
      .eq("id", orderId)
      .maybeSingle();

    if (error || !order?.guest_email) {
      return new Response("No recipient", { status: 200 });
    }

    const subject = statusSubjectMap[status] || "订单状态更新";
    const html = buildHtml(orderId, status);

    const notifyResponse = await fetch(NOTIFY_FUNCTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTIFY_FUNCTION_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: order.guest_email,
        subject,
        html,
      }),
    });

    if (!notifyResponse.ok) {
      const errorText = await notifyResponse.text();
      return new Response(`Notify error: ${errorText}`, { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Error", { status: 500 });
  }
});
