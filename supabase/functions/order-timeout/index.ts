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
    const now = new Date().toISOString();
    const { data: orders, error } = await client
      .from("orders")
      .select("id")
      .eq("status", "pending")
      .lte("payment_due_at", now);

    if (error) {
      throw error;
    }

    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ ok: true, closed: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const orderIds = orders.map((order: { id: string }) => order.id);

    const { data: defaultWarehouse, error: warehouseError } = await client
      .from("warehouses")
      .select("id")
      .eq("code", "WH-MAIN")
      .maybeSingle();

    if (warehouseError || !defaultWarehouse?.id) {
      throw new Error("Default warehouse not found");
    }
    const { error: updateError } = await client
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: now,
        status_updated_at: now,
      })
      .in("id", orderIds);

    if (updateError) {
      throw updateError;
    }

    await client.from("order_tracking").insert(
      orderIds.map((id: string) => ({
        order_id: id,
        status: "cancelled",
        description: "订单超时未支付，已自动取消",
      }))
    );

    const { data: orderItems, error: itemsError } = await client
      .from("order_items")
      .select("sku_id, quantity, order_id")
      .in("order_id", orderIds);

    if (itemsError) {
      throw itemsError;
    }

    const warehouseId = defaultWarehouse.id as string;
    for (const item of orderItems || []) {
      if (!item.sku_id) continue;

      const { data: inventoryRow, error: inventoryError } = await client
        .from("inventory")
        .select("id, available, reserved")
        .eq("sku_id", item.sku_id)
        .eq("warehouse_id", warehouseId)
        .maybeSingle();

      if (inventoryError || !inventoryRow) continue;

      await client
        .from("inventory")
        .update({
          available: inventoryRow.available + item.quantity,
          reserved: Math.max(0, inventoryRow.reserved - item.quantity),
        })
        .eq("id", inventoryRow.id);
    }

    return new Response(JSON.stringify({ ok: true, closed: orderIds.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Error", { status: 500 });
  }
});
