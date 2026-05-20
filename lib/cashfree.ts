interface CashfreeOrderInput {
  orderId: string;
  orderAmount: string;
  orderCurrency: string;
  customerEmail: string;
  customerPhone?: string;
  returnUrl: string;
}

interface CashfreeOrderResponse {
  paymentLink?: string;
  paymentSessionId?: string;
  orderId: string;
  rawBody?: any;
}

const CASHFREE_ENV = process.env.CASHFREE_ENV?.toLowerCase() === "production"
  ? "production"
  : "sandbox";
const CASHFREE_BASE_URL = CASHFREE_ENV === "production"
  ? "https://api.cashfree.com/pg/orders"
  : "https://sandbox.cashfree.com/pg/orders";
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
  console.warn(
    "Cashfree is not fully configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in your environment.",
  );
}

export async function createCashfreeOrder(
  input: CashfreeOrderInput,
): Promise<CashfreeOrderResponse> {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    throw new Error("Missing Cashfree credentials.");
  }

  const allowedPaymentMethods = new Set([
    "cc",
    "dc",
    "ppc",
    "ccc",
    "emi",
    "paypal",
    "upi",
    "nb",
    "app",
    "paylater",
    "applepay",
  ]);

  const paymentMethodMap: Record<string, string> = {
    card: "cc",
    credit: "cc",
    debit: "dc",
    netbanking: "nb",
    wallet: "app",
    paytm: "app",
    cardless: "ppc",
  };

  const rawPaymentMethods =
    process.env.CASHFREE_PAYMENT_METHODS?.trim() ||
    "cc,upi,nb,app";

  const paymentMethods = Array.from(
    new Set(
      rawPaymentMethods
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
        .map((item) => paymentMethodMap[item] || item),
    ),
  ).filter((item) => {
    if (!allowedPaymentMethods.has(item)) {
      console.warn(
        `Ignored unsupported Cashfree payment method: ${item}. ` +
          `Allowed values: ${Array.from(allowedPaymentMethods).join(",")}`,
      );
      return false;
    }
    return true;
  });

  if (paymentMethods.length === 0) {
    throw new Error(
      "Cashfree payment methods configuration invalid. Set CASHFREE_PAYMENT_METHODS to one of: cc,dc,ppc,ccc,emi,paypal,upi,nb,app,paylater,applepay",
    );
  }

  const payload = {
    order_id: input.orderId,
    order_amount: input.orderAmount,
    order_currency: input.orderCurrency,
    customer_details: {
      // sanitized customer_id handled below when building body
      customer_id: undefined,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone || "0000000000",
    },
    order_meta: {
      return_url: input.returnUrl,
      payment_methods: paymentMethods.join(","),
    },
  } as any;

  // Build sanitized customer_id
  payload.customer_details.customer_id = (() => {
    const raw = String(input.customerEmail || "").trim();
    const local = raw.includes("@") ? raw.split("@")[0] : raw;
    const sanitized = local.replace(/[^A-Za-z0-9_-]/g, "_");
    return sanitized || `cust-${String(input.orderId)}`;
  })();

  // Log the outgoing payload for easier debugging
  try {
    console.debug("Cashfree request payload:", JSON.stringify(payload));
  } catch {}

  const response = await fetch(CASHFREE_BASE_URL, {
    method: "POST",
    headers: (() => {
      const allowed = [
        "2021-05-21",
        "2022-01-01",
        "2022-09-01",
        "2023-08-01",
        "2025-01-01",
        "2026-01-01",
      ];
      const envVersion = process.env.CASHFREE_API_VERSION?.trim();
      const defaultVersion = "2023-08-01";
      let apiVersion = defaultVersion;
      if (envVersion) {
        if (allowed.includes(envVersion)) {
          apiVersion = envVersion;
        } else {
          console.warn(
            `CASHFREE_API_VERSION '${envVersion}' is not one of allowed values; falling back to ${defaultVersion}`,
          );
        }
      }
      return {
        "Content-Type": "application/json",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": apiVersion,
      };
    })(),
    body: JSON.stringify(payload),
  });

  const body = await response.json();
  if (!response.ok) {
    const message = body?.message || body?.error || `Cashfree order creation failed (status ${response.status}).`;
    const detail = JSON.stringify(body);
    throw new Error(`${message} Response: ${detail}`);
  }

  // Prefer explicit payment_link, but if provider returns a payment_session_id
  // return that to the caller so the frontend can construct/redirect to the
  // correct checkout URL (implementation depends on account/environment).
  return {
    paymentLink: body.payment_link || undefined,
    paymentSessionId: body.payment_session_id || body.paymentSessionId || undefined,
    orderId: input.orderId,
    rawBody: body,
  } as CashfreeOrderResponse;
}

export async function verifyCashfreeOrder(orderId: string) {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    throw new Error("Missing Cashfree credentials.");
  }

  const url = `${CASHFREE_BASE_URL}/${encodeURIComponent(orderId)}`;
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": CASHFREE_APP_ID,
      "x-client-secret": CASHFREE_SECRET_KEY,
      "x-api-version": process.env.CASHFREE_API_VERSION || "2023-08-01",
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.message || body?.error || `Cashfree verify failed (status ${response.status}).`;
    const detail = JSON.stringify(body);
    throw new Error(`${message} Response: ${detail}`);
  }

  return body;
}
