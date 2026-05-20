"use client";

import { getAuthEmail, isAuthSessionValid } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type OrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type OrderAddress = {
  id: string | number;
  name: string;
  mobile: string;
  pincode: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  addressType: "home" | "work";
};

type Order = {
  id: string | number;
  createdAt: string;
  deliveredAt?: string;
  customerEmail?: string;
  items: OrderItem[];
  addressId: string | number;
  paymentMethod: string; // already exists, just make sure it's here
  total: number;
  status:
    | "pending"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "return_requested"
    | "returned";
  address?: OrderAddress | null;
};

function formatDate(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return value;
  return new Date(timestamp).toLocaleString();
}

function isWithin30Days(dateStr?: string): boolean {
  if (!dateStr) return false;
  const timestamp = Date.parse(dateStr);
  if (!Number.isFinite(timestamp)) return false;
  const diffDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  return diffDays <= 30;
}

const STATUS_STEPS = ["pending", "confirmed", "shipped", "delivered"] as const;

function Stepper({ status }: { status: Order["status"] }) {
  if (status === "cancelled") {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/30">
        <svg
          className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <p className="text-sm font-medium text-red-700 dark:text-red-300">
          This order has been cancelled.
        </p>
      </div>
    );
  }

  if (status === "return_requested") {
    return (
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Return requested
          </p>
        </div>
        <p className="ml-6 mt-1 text-xs text-amber-600 dark:text-amber-400">
          Your return request is being processed. We'll update you soon.
        </p>
      </div>
    );
  }

  if (status === "returned") {
    return (
      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/30">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Order returned
          </p>
        </div>
        <p className="ml-6 mt-1 text-xs text-emerald-600 dark:text-emerald-400">
          Your return has been completed successfully.
        </p>
      </div>
    );
  }

  const activeIndex = Math.max(
    0,
    STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]),
  );

  const labels: Record<(typeof STATUS_STEPS)[number], string> = {
    pending: "Placed",
    confirmed: "Confirmed",
    shipped: "Shipped",
    delivered: "Delivered",
  };

  return (
    <div className="mt-4">
      <div className="flex items-start gap-2">
        {STATUS_STEPS.map((step, index) => {
          const done = index <= activeIndex;
          const isLast = index === STATUS_STEPS.length - 1;
          return (
            <div key={step} className="flex min-w-0 flex-1 items-start">
              <div className="flex min-w-0 flex-col items-center">
                <div
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                    done
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
                  ].join(" ")}
                >
                  {done ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="mt-2 text-center text-xs text-zinc-600 dark:text-zinc-400">
                  {labels[step]}
                </span>
              </div>
              {!isLast && (
                <div
                  className={[
                    "mx-2 mt-4 h-1 flex-1 rounded-full transition-colors",
                    index < activeIndex
                      ? "bg-emerald-600"
                      : "bg-zinc-200 dark:bg-zinc-800",
                  ].join(" ")}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const config: Record<Order["status"], { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className: "border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
    },
    confirmed: {
      label: "Confirmed",
      className: "border-blue-200 text-blue-700 dark:border-blue-900/50 dark:text-blue-300",
    },
    shipped: {
      label: "Shipped",
      className: "border-violet-200 text-violet-700 dark:border-violet-900/50 dark:text-violet-300",
    },
    delivered: {
      label: "Delivered",
      className: "border-emerald-200 text-emerald-700 dark:border-emerald-900/50 dark:text-emerald-300",
    },
    cancelled: {
      label: "Cancelled",
      className: "border-red-200 text-red-700 dark:border-red-900/50 dark:text-red-300",
    },
    return_requested: {
      label: "Return Requested",
      className: "border-amber-200 text-amber-700 dark:border-amber-900/50 dark:text-amber-300",
    },
    returned: {
      label: "Returned",
      className: "border-teal-200 text-teal-700 dark:border-teal-900/50 dark:text-teal-300",
    },
  };

  const { label, className } = config[status] ?? config.pending;

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [returningOrderId, setReturningOrderId] = useState<string | null>(null);

  const email = useMemo(() => getAuthEmail().trim().toLowerCase(), []);

  const refreshOrders = async (customerEmail: string) => {
  const response = await fetch(
    `/api/orders/history?email=${encodeURIComponent(customerEmail)}`,
  );
  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(body.message || "Unable to load your orders.");
  }
  const body = (await response.json()) as { orders: Order[] };
  const orders: Order[] = body.orders ?? [];

  // Auto-verify any pending cashfree orders
  const pendingCashfreeOrders = orders.filter(
    (o) => o.status === "pending" && o.paymentMethod === "cashfree",
  );

  if (pendingCashfreeOrders.length > 0) {
    await Promise.allSettled(
      pendingCashfreeOrders.map((o) =>
        fetch(`/api/cashfree/verify?orderId=${encodeURIComponent(String(o.id))}`),
      ),
    );
    // Re-fetch after verification
    const refreshed = await fetch(
      `/api/orders/history?email=${encodeURIComponent(customerEmail)}`,
    );
    if (refreshed.ok) {
      const refreshedBody = (await refreshed.json()) as { orders: Order[] };
      setOrders(refreshedBody.orders ?? []);
      return;
    }
  }

  setOrders(orders);
};

  useEffect(() => {
    if (!isAuthSessionValid()) {
      router.replace(`/auth/login?redirect=${encodeURIComponent("/orders")}`);
      return;
    }
    if (!email) {
      router.replace(`/auth/login?redirect=${encodeURIComponent("/orders")}`);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");
        await refreshOrders(email);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load your orders.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [email, router]);

  const cancel = async (orderId: string) => {
    if (!email) return;
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      setCancellingOrderId(orderId);
      setError("");
      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled", email }),
        },
      );
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message || "Unable to cancel order.");
      }
      await refreshOrders(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel order.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const returnOrder = async (orderId: string) => {
    if (!email) return;
    if (!window.confirm("Request a return for this order?")) return;
    try {
      setReturningOrderId(orderId);
      setError("");
      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderId)}/return`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message || "Unable to place return request.");
      }
      await refreshOrders(email);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to place return request.",
      );
    } finally {
      setReturningOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Home
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <h1 className="text-base font-semibold">My Orders</h1>
          </div>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Continue shopping
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Loading orders...
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
              <svg
                className="h-7 w-7 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-base font-semibold">No orders yet</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Place your first order and it will show up here.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Shop now
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const s = order.status;

              const showCancel =
                s !== "delivered" &&
                s !== "cancelled" &&
                s !== "return_requested" &&
                s !== "returned";

              const showReturn =
                s === "delivered" &&
                isWithin30Days(order.deliveredAt ?? order.createdAt);

              const returnWindowClosed =
                s === "delivered" && !showReturn;

              return (
                <article
                  key={String(order.id)}
                  className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  {/* Order header */}
                  <div className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-900 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Order{" "}
                        <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                          #{String(order.id).slice(-8).toUpperCase()}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                        Placed {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      <span className="text-sm font-semibold">
                        ₹{order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    {/* Stepper */}
                    <Stepper status={order.status} />

                    {/* Items */}
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                        Items
                      </p>
                      <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-900">
                        {order.items.map((item) => (
                          <li
                            key={`${order.id}-${item.id}`}
                            className="flex items-center justify-between gap-4 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                                {item.name}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Qty {item.quantity} · ₹{item.price.toFixed(2)} each
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-medium">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Delivery address */}
                    {order.address && (
                      <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                          Delivery address
                        </p>
                        <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          {order.address.name}
                          <span className="ml-2 font-normal text-zinc-500">
                            {order.address.mobile}
                          </span>
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {order.address.address}, {order.address.locality},{" "}
                          {order.address.city}, {order.address.state} –{" "}
                          {order.address.pincode}
                        </p>
                      </div>
                    )}

                    {/* Return window closed notice */}
                    {returnWindowClosed && (
                      <div className="mt-4 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                        <svg
                          className="h-4 w-4 shrink-0 text-zinc-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Return window has closed. Returns are only accepted
                          within 30 days of delivery.
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {(showCancel || showReturn) && (
                      <div className="mt-4 flex justify-end">
                        {showCancel && (
                          <button
                            type="button"
                            onClick={() => cancel(String(order.id))}
                            disabled={cancellingOrderId === String(order.id)}
                            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/30"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            {cancellingOrderId === String(order.id)
                              ? "Cancelling..."
                              : "Cancel order"}
                          </button>
                        )}

                        {showReturn && (
                          <button
                            type="button"
                            onClick={() => returnOrder(String(order.id))}
                            disabled={returningOrderId === String(order.id)}
                            className="flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-50 dark:border-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-950/30"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                              />
                            </svg>
                            {returningOrderId === String(order.id)
                              ? "Requesting..."
                              : "Return order"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}