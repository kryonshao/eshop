// @ts-ignore: Deno runtime import
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

/// <reference lib="deno.ns" />

// @ts-ignore: Deno runtime env
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
// @ts-ignore: Deno runtime env
const MAIL_FROM = Deno.env.get("MAIL_FROM") ?? "no-reply@example.com";

type NotifyRequest = {
  to: string;
  subject: string;
  html: string;
};

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!RESEND_API_KEY) {
    return new Response("Missing RESEND_API_KEY", { status: 500 });
  }

  try {
    const body = (await req.json()) as NotifyRequest;
    if (!body?.to || !body?.subject || !body?.html) {
      return new Response("Invalid request", { status: 400 });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [body.to],
        subject: body.subject,
        html: body.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(`Resend error: ${errorText}`, { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Error", { status: 500 });
  }
});
