// @ts-ignore: Deno runtime import
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

/// <reference lib="deno.ns" />

// @ts-ignore: Deno runtime env
const NOWPAYMENTS_API_KEY = Deno.env.get("NOWPAYMENTS_API_KEY") ?? "";
// @ts-ignore: Deno runtime env
const NOWPAYMENTS_BASE_URL = Deno.env.get("NOWPAYMENTS_BASE_URL") ?? "https://api.nowpayments.io/v1";
// @ts-ignore: Deno runtime env
const WEBHOOK_URL = Deno.env.get("NOWPAYMENTS_WEBHOOK_URL") ?? "";

type CreatePaymentRequest = {
  orderId: string;
  amountUSD: number;
  customerId: string;
  guestEmail?: string;
};

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!NOWPAYMENTS_API_KEY || !WEBHOOK_URL) {
    return new Response("Missing NOWPayments config", { status: 500 });
  }

  try {
    const body = (await req.json()) as CreatePaymentRequest;
    if (!body?.orderId || !body?.amountUSD || !body?.customerId) {
      return new Response("Invalid request", { status: 400 });
    }

    const nowPaymentsResponse = await fetch(`${NOWPAYMENTS_BASE_URL}/payment`, {
      method: "POST",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: body.orderId,
        priceAmount: body.amountUSD,
        priceCurrency: "USD",
        payCurrency: "usdt",
        ipnCallbackUrl: WEBHOOK_URL,
        orderDescription: `Order ${body.orderId}`,
      }),
    });

    if (!nowPaymentsResponse.ok) {
      const errorText = await nowPaymentsResponse.text();
      return new Response(`NOWPayments error: ${errorText}`, { status: 502 });
    }

    const data = await nowPaymentsResponse.json();

    return new Response(
      JSON.stringify({
        paymentId: data.payment_id,
        paymentStatus: data.payment_status,
        payAddress: data.pay_address,
        payAmount: data.pay_amount,
        payCurrency: data.pay_currency,
        priceAmount: data.price_amount,
        paymentUrl: data.payment_url || `https://nowpayments.io/payment/?iid=${data.payment_id}`,
        expirationEstimateDate: data.expiration_estimate_date,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response("Internal Error", { status: 500 });
  }
});
