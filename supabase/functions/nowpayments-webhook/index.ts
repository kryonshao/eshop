// @ts-ignore: Deno runtime import
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore: Deno runtime import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
// @ts-ignore: Deno runtime import
import { createHmac } from "https://deno.land/std@0.224.0/crypto/mod.ts";

/// <reference lib="deno.ns" />

// @ts-ignore: Deno runtime env
const NOWPAYMENTS_IPN_SECRET = Deno.env.get("NOWPAYMENTS_IPN_SECRET") ?? "";
// @ts-ignore: Deno runtime env
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore: Deno runtime env
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const mapStatus = (nowpaymentsStatus: string) => {
  const statusMap: Record<string, string> = {
    waiting: "pending",
    confirming: "processing",
    confirmed: "processing",
    sending: "processing",
    partially_paid: "processing",
    finished: "succeeded",
    failed: "failed",
    refunded: "canceled",
    expired: "expired",
  };
  return statusMap[nowpaymentsStatus] ?? "pending";
};

const computeEventHash = async (payload: string) => {
  const data = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!NOWPAYMENTS_IPN_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Missing IPN secret", { status: 500 });
  }

  const signature = req.headers.get("x-nowpayments-sig") ?? "";
  const rawBody = await req.text();

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const expectedSignature = createHmac("sha512", NOWPAYMENTS_IPN_SECRET)
    .update(rawBody)
    .toString();

  if (expectedSignature !== signature) {
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const mappedStatus = mapStatus(payload.payment_status);
    const eventHash = await computeEventHash(rawBody);

    const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: existingEvent } = await client
      .from("nowpayments_webhook_events")
      .select("id, processed_at")
      .eq("event_hash", eventHash)
      .maybeSingle();

    if (existingEvent?.processed_at) {
      return new Response(JSON.stringify({ ok: true, status: mappedStatus, duplicate: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: insertedEvent, error: insertError } = await client
      .from("nowpayments_webhook_events")
      .insert({
        event_hash: eventHash,
        payment_id: payload.payment_id?.toString() ?? null,
        order_id: payload.order_id?.toString() ?? null,
        payment_status: payload.payment_status ?? null,
        raw_payload: payload,
        signature,
        processed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      // If duplicate insert, treat as already processed
      return new Response(JSON.stringify({ ok: true, status: mappedStatus, duplicate: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    await client.from("system_events").insert({
      event_type: "nowpayments_webhook",
      severity: "info",
      source: "nowpayments-webhook",
      payload: {
        payment_id: payload.payment_id,
        order_id: payload.order_id,
        status: payload.payment_status,
      },
    });

    if (payload.payment_id) {
      await client
        .from("payments")
        .update({ status: mappedStatus, actually_paid: payload.actually_paid })
        .eq("nowpayments_payment_id", payload.payment_id.toString());
    }

    if (payload.order_id) {
      const orderId = payload.order_id.toString();
      const now = new Date().toISOString();
      const isSuccess = mappedStatus === "succeeded";
      const isFailure = mappedStatus === "failed" || mappedStatus === "expired" || mappedStatus === "canceled";
      const nextStatus = isSuccess ? "paid" : isFailure ? "cancelled" : "pending";
      // @ts-ignore: Deno runtime env
      const notifyUrl = Deno.env.get("NOTIFY_ORDER_STATUS_URL") ?? "";
      // @ts-ignore: Deno runtime env
      const notifyKey = Deno.env.get("NOTIFY_ORDER_STATUS_KEY") ?? "";

      await client
        .from("orders")
        .update({
          status: nextStatus,
          paid_at: isSuccess ? now : null,
          cancelled_at: isFailure ? now : null,
          status_updated_at: now,
        })
        .eq("id", orderId);

      if (isSuccess) {
        await client.from("order_tracking").insert({
          order_id: orderId,
          status: "paid",
          description: "支付已完成",
        });
      }

      if (isFailure) {
        await client.from("order_tracking").insert({
          order_id: orderId,
          status: "cancelled",
          description: "支付失败/过期，订单已取消",
        });
      }

      if (notifyUrl && notifyKey) {
        await fetch(notifyUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${notifyKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId, status: nextStatus }),
        });
      }

      if (isSuccess) {
        const { data: defaultWarehouse, error: warehouseError } = await client
          .from("warehouses")
          .select("id")
          .eq("code", "WH-MAIN")
          .maybeSingle();

        if (!warehouseError && defaultWarehouse?.id) {
          const { data: orderItems } = await client
            .from("order_items")
            .select("sku_id, quantity")
            .eq("order_id", orderId);

          for (const item of orderItems || []) {
            if (!item.sku_id) continue;
            const { data: inventoryRow } = await client
              .from("inventory")
              .select("id, reserved")
              .eq("sku_id", item.sku_id)
              .eq("warehouse_id", defaultWarehouse.id)
              .maybeSingle();

            if (!inventoryRow) continue;

            await client
              .from("inventory")
              .update({ reserved: Math.max(0, inventoryRow.reserved - item.quantity) })
              .eq("id", inventoryRow.id);
          }
        }
      }

      if (isFailure) {
        const { data: defaultWarehouse, error: warehouseError } = await client
          .from("warehouses")
          .select("id")
          .eq("code", "WH-MAIN")
          .maybeSingle();

        if (!warehouseError && defaultWarehouse?.id) {
          const { data: orderItems } = await client
            .from("order_items")
            .select("sku_id, quantity")
            .eq("order_id", orderId);

          for (const item of orderItems || []) {
            if (!item.sku_id) continue;
            const { data: inventoryRow } = await client
              .from("inventory")
              .select("id, available, reserved")
              .eq("sku_id", item.sku_id)
              .eq("warehouse_id", defaultWarehouse.id)
              .maybeSingle();

            if (!inventoryRow) continue;

            await client
              .from("inventory")
              .update({
                available: inventoryRow.available + item.quantity,
                reserved: Math.max(0, inventoryRow.reserved - item.quantity),
              })
              .eq("id", inventoryRow.id);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, status: mappedStatus, eventId: insertedEvent?.id }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response("Invalid payload", { status: 400 });
  }
});
