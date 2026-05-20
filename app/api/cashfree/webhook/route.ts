import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { verifyCashfreePayment } from "@/lib/services";

export const runtime = "nodejs";

function timingSafeEqualString(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function computeWebhookSignature(input: {
  secret: string;
  timestamp: string;
  rawBody: string;
}) {
  const hmac = crypto.createHmac("sha256", input.secret);
  // Cashfree docs specify signing `timestamp + rawBody`.
  hmac.update(input.timestamp + input.rawBody, "utf8");
  return hmac.digest("base64");
}

function computeWebhookSignatureAlt(input: {
  secret: string;
  timestamp: string;
  rawBody: string;
}) {
  // Some examples use a dot separator: `${timestamp}.${rawBody}`.
  const hmac = crypto.createHmac("sha256", input.secret);
  hmac.update(`${input.timestamp}.${input.rawBody}`, "utf8");
  return hmac.digest("base64");
}

function extractOrderId(payload: any): string | null {
  return (
    payload?.data?.order?.order_id ??
    payload?.data?.order?.orderId ??
    payload?.data?.order_id ??
    payload?.order_id ??
    payload?.orderId ??
    null
  );
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-webhook-signature") ||
    request.headers.get("x-cashfree-signature") ||
    request.headers.get("x-cf-signature");
  const timestamp =
    request.headers.get("x-webhook-timestamp") ||
    request.headers.get("x-cashfree-timestamp") ||
    request.headers.get("x-cf-timestamp");

  const secret =
    process.env.CASHFREE_WEBHOOK_SECRET?.trim() ||
    process.env.CASHFREE_SECRET_KEY?.trim() ||
    "";

  if (!signature || !timestamp) {
    return NextResponse.json(
      { ok: false, message: "Missing Cashfree webhook signature headers." },
      { status: 400 },
    );
  }

  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Missing webhook secret. Set CASHFREE_WEBHOOK_SECRET (or CASHFREE_SECRET_KEY).",
      },
      { status: 500 },
    );
  }

  const expected = computeWebhookSignature({ secret, timestamp, rawBody });
  const expectedAlt = computeWebhookSignatureAlt({ secret, timestamp, rawBody });
  const signatureOk =
    timingSafeEqualString(signature, expected) ||
    timingSafeEqualString(signature, expectedAlt);

  if (!signatureOk) {
    return NextResponse.json(
      { ok: false, message: "Invalid Cashfree webhook signature." },
      { status: 401 },
    );
  }

  let payload: any = null;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const orderId = extractOrderId(payload);
  if (!orderId) {
    return NextResponse.json(
      { ok: false, message: "order_id not found in webhook payload." },
      { status: 400 },
    );
  }

  try {
    // Re-verify with Cashfree API and update DB status.
    const verification = await verifyCashfreePayment(String(orderId));
    return NextResponse.json({ ok: true, orderId, verification }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    return NextResponse.json({ ok: false, orderId, message }, { status: 500 });
  }
}

