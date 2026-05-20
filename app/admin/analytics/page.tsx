"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/AdminSidebar";
import AdminNotificationsBell from "../components/AdminNotificationsBell";

type OrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type Order = {
  id: string | number;
  createdAt: string;
  items: OrderItem[];
  paymentMethod: string;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
};

function formatCurrencyINR(value: number) {
  return `Rs ${value.toFixed(2)}`;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIsoDay(date: Date) {
  const d = startOfDay(date);
  return d.toISOString().slice(0, 10);
}

function parseCreatedAt(value: string) {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms) : null;
}

function StatCard(props: { label: string; value: string; sub?: string }) {
  const { label, value, sub } = props;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {sub ? (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{sub}</p>
      ) : null}
    </div>
  );
}

function MiniBarChart(props: { labels: string[]; values: number[] }) {
  const { labels, values } = props;
  const max = Math.max(1, ...values);
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Orders (last 7 days)</p>
        <p className="text-xs text-zinc-500">Daily count</p>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-2 items-end">
        {values.map((v, idx) => (
          <div key={labels[idx]} className="flex flex-col items-center gap-2">
            <div
              className="w-full rounded-lg bg-emerald-600/80 dark:bg-emerald-500/80"
              style={{ height: `${Math.max(6, (v / max) * 88)}px` }}
              title={`${labels[idx]}: ${v}`}
            />
            <span className="text-[11px] text-zinc-500">{labels[idx]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const isAdminLoggedIn =
      localStorage.getItem("munch_admin_logged_in") === "true";
    if (!isAdminLoggedIn) {
      router.replace("/admin/login?redirect=/admin/analytics");
      return;
    }
    setIsCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    if (isCheckingAuth) {
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/orders");
        if (!response.ok) {
          throw new Error("Failed to fetch orders.");
        }
        const body = (await response.json()) as { orders: Order[] };
        setOrders(Array.isArray(body.orders) ? body.orders : []);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to fetch orders.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isCheckingAuth]);

  const handleLogout = () => {
    localStorage.removeItem("munch_admin_logged_in");
    router.replace("/admin/login");
  };

  const analytics = useMemo(() => {
    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const byStatus = orders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<Order["status"], number>,
    );

    const byPayment = orders.reduce((acc, order) => {
      const key = String(order.paymentMethod || "unknown").toLowerCase();
      acc[key] = (acc[key] ?? 0) + (Number(order.total) || 0);
      return acc;
    }, {} as Record<string, number>);

    const productTotals = new Map<
      number,
      { name: string; qty: number; revenue: number }
    >();
    for (const order of orders) {
      for (const item of order.items || []) {
        const current = productTotals.get(item.id) ?? {
          name: item.name,
          qty: 0,
          revenue: 0,
        };
        current.qty += Number(item.quantity) || 0;
        current.revenue += (Number(item.quantity) || 0) * (Number(item.price) || 0);
        productTotals.set(item.id, current);
      }
    }

    const topProducts = Array.from(productTotals.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const labels = days.map((d) =>
      d.toLocaleDateString(undefined, { weekday: "short" }),
    );
    const isoDays = new Set(days.map(toIsoDay));
    const ordersByDay: Record<string, number> = {};
    for (const d of days) {
      ordersByDay[toIsoDay(d)] = 0;
    }
    for (const order of orders) {
      const created = parseCreatedAt(order.createdAt);
      if (!created) continue;
      const key = toIsoDay(created);
      if (!isoDays.has(key)) continue;
      ordersByDay[key] += 1;
    }
    const dailyValues = days.map((d) => ordersByDay[toIsoDay(d)] ?? 0);

    return {
      totalOrders,
      revenue,
      byStatus,
      byPayment,
      topProducts,
      dailyLabels: labels,
      dailyValues,
    };
  }, [orders]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Checking admin access...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-4 text-zinc-900 dark:bg-black dark:text-zinc-100 sm:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-start">
        <AdminSidebar />

        <div className="flex-1 space-y-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Admin Dashboard
              </p>
              <h1 className="mt-1 text-2xl font-bold">Analytics</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Orders and revenue overview.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AdminNotificationsBell />
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Logout
              </button>
            </div>
          </header>

          {loading && (
            <p className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              Loading analytics...
            </p>
          )}

          {!loading && error && (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </p>
          )}

          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Orders"
                  value={String(analytics.totalOrders)}
                  sub={`${analytics.byStatus.delivered ?? 0} delivered`}
                />
                <StatCard
                  label="Revenue"
                  value={formatCurrencyINR(analytics.revenue)}
                  sub="Gross (all statuses)"
                />
                <StatCard
                  label="Active"
                  value={String(
                    (analytics.byStatus.pending ?? 0) +
                      (analytics.byStatus.confirmed ?? 0) +
                      (analytics.byStatus.shipped ?? 0),
                  )}
                  sub="Pending + confirmed + shipped"
                />
                <StatCard
                  label="Cancelled"
                  value={String(analytics.byStatus.cancelled ?? 0)}
                  sub="User/admin cancelled"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <MiniBarChart
                  labels={analytics.dailyLabels}
                  values={analytics.dailyValues}
                />
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Top Products</p>
                    <p className="text-xs text-zinc-500">By quantity</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {analytics.topProducts.length === 0 ? (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        No order items yet.
                      </p>
                    ) : (
                      analytics.topProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {p.name}
                            </p>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                              Qty {p.qty} · {formatCurrencyINR(p.revenue)}
                            </p>
                          </div>
                          <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                            {p.qty}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Revenue by Payment</p>
                  <p className="text-xs text-zinc-500">Gross</p>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(analytics.byPayment)
                    .sort((a, b) => b[1] - a[1])
                    .map(([method, value]) => (
                      <div
                        key={method}
                        className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {method}
                        </p>
                        <p className="mt-2 text-lg font-bold">
                          {formatCurrencyINR(value)}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
