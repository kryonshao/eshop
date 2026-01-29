// @ts-ignore: Deno runtime import
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

/// <reference lib="deno.ns" />

// @ts-ignore: Deno runtime env
const NOWPAYMENTS_API_KEY = Deno.env.get("NOWPAYMENTS_API_KEY") ?? "";
// @ts-ignore: Deno runtime env
const NOWPAYMENTS_BASE_URL = Deno.env.get("NOWPAYMENTS_BASE_URL") ?? "https://api.nowpayments.io/v1";

type StatusRequest = {
  paymentId: string;
};

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

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!NOWPAYMENTS_API_KEY) {
    return new Response("Missing NOWPayments config", { status: 500 });
  }

  try {
    const body = (await req.json()) as StatusRequest;
    if (!body?.paymentId) {
      return new Response("Invalid request", { status: 400 });
    }

    const response = await fetch(`${NOWPAYMENTS_BASE_URL}/payment/${body.paymentId}`, {
      headers: { "x-api-key": NOWPAYMENTS_API_KEY },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(`NOWPayments error: ${errorText}`, { status: 502 });
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({
        status: mapStatus(data.payment_status),
        rawStatus: data.payment_status,
        actuallyPaid: data.actually_paid,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response("Internal Error", { status: 500 });
  }
});
