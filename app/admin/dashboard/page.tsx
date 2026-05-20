"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/AdminSidebar";
import AdminNotificationsBell from "../components/AdminNotificationsBell";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrderAddress {
  id: number;
  name: string;
  mobile: string;
  pincode: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  addressType: "home" | "work";
}

interface Order {
  id: string | number;
  createdAt: string;
  items: OrderItem[];
  addressId: string | number;
  paymentMethod: string;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  address: OrderAddress | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const otherOrders = orders.filter((o) => o.status !== "delivered");

  useEffect(() => {
    const isAdminLoggedIn =
      localStorage.getItem("munch_admin_logged_in") === "true";
    if (!isAdminLoggedIn) {
      router.replace("/admin/login?redirect=/admin/dashboard");
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
        setIsLoading(true);
        setError("");
        const response = await fetch("/api/orders");
        if (!response.ok) {
          throw new Error("Failed to fetch orders.");
        }
        const body = (await response.json()) as { orders: Order[] };
        setOrders(body.orders);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to fetch orders.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [isCheckingAuth]);

  const handleLogout = () => {
    localStorage.removeItem("munch_admin_logged_in");
    router.replace("/admin/login");
  };

  const updateStatus = async (
    orderId: Order["id"],
    status: Order["status"],
  ) => {
    const orderKey = String(orderId);
    try {
      setUpdatingOrderId(orderKey);
      const response = await fetch(`/api/orders/${encodeURIComponent(orderKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message || "Failed to update order.");
      }

      setOrders((prev) =>
        prev.map((order) =>
          String(order.id) === orderKey ? { ...order, status } : order,
        ),
      );
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : "Failed to update order.";
      setError(message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const statusRank: Record<Order["status"], number> = {
    pending: 0,
    confirmed: 1,
    shipped: 2,
    delivered: 3,
    cancelled: 99,
  };

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

        <div className="flex-1">
          <header className="mb-6 flex items-start justify-between gap-4">
            <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Admin Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-bold">Active Orders</h1>
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

          {isLoading && (
            <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              Loading orders...
            </p>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}

          {!isLoading && !error && orders.length === 0 && (
            <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              No orders yet.
            </p>
          )}

          {!isLoading && !error && otherOrders.length > 0 && (
            <div className="space-y-4">
              {otherOrders.map((order) => (
                <section
                  key={order.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold">
                        Order #{order.id}
                      </h2>
                      <p className="text-xs text-zinc-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        Status: {order.status}
                      </p>
                      <p className="text-sm font-medium">
                        Payment: {order.paymentMethod.toUpperCase()}
                      </p>
                      <p className="text-lg font-bold">
                        Rs {order.total.toFixed(2)}
                      </p>
                  </div>
                  </div>

                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Change status
                    </label>
                    <select
                      value={order.status}
                      disabled={
                        updatingOrderId === String(order.id) ||
                        order.status === "delivered" ||
                        order.status === "cancelled"
                      }
                      onChange={(event) => {
                        const next = event.target.value as Order["status"];
                        if (next === order.status) {
                          return;
                        }
                        if (next === "cancelled") {
                          const ok = window.confirm("Cancel this order?");
                          if (!ok) {
                            return;
                          }
                        }
                        updateStatus(order.id, next);
                      }}
                      className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                      <option value="pending" disabled>
                        pending
                      </option>
                      <option
                        value="confirmed"
                        disabled={statusRank[order.status] > statusRank.confirmed}
                      >
                        confirmed
                      </option>
                      <option
                        value="shipped"
                        disabled={
                          statusRank[order.status] < statusRank.confirmed ||
                          statusRank[order.status] > statusRank.shipped
                        }
                      >
                        shipped
                      </option>
                      <option
                        value="delivered"
                        disabled={statusRank[order.status] < statusRank.shipped}
                      >
                        delivered
                      </option>
                      <option value="cancelled">cancelled</option>
                    </select>
                    {updatingOrderId === String(order.id) ? (
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Updating...
                      </span>
                    ) : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-semibold">Items</p>
                      <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                        {order.items.map((item) => (
                          <li
                            key={`${order.id}-${item.id}`}
                            className="flex items-center gap-3 rounded-md border border-zinc-200 p-2 dark:border-zinc-800"
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-12 w-12 rounded object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
                            )}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p>
                                {item.quantity} x Rs {item.price.toFixed(2)} =
                                Rs {(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-semibold">
                        Delivery Address
                      </p>
                      {order.address ? (
                        <div className="text-sm text-zinc-700 dark:text-zinc-300">
                          <p>{order.address.name}</p>
                          <p>
                            {order.address.address}, {order.address.locality}
                          </p>
                          <p>
                            {order.address.city}, {order.address.state} -{" "}
                            {order.address.pincode}
                          </p>
                          <p>Mobile: {order.address.mobile}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500">
                          Address not found.
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}
          {!isLoading && !error && deliveredOrders.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold">Delivered Orders</h2>
              <div className="mt-4 space-y-4">
                {deliveredOrders.map((order) => (
                  <section
                    key={order.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-semibold">
                          Order #{order.id}
                        </h2>
                        <p className="text-xs text-zinc-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">
                          Status: {order.status}
                        </p>
                        <p className="text-sm font-medium">
                          Payment: {order.paymentMethod.toUpperCase()}
                        </p>
                        <p className="text-lg font-bold">
                          Rs {order.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-sm font-semibold">Items</p>
                        <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                          {order.items.map((item) => (
                            <li
                              key={`${order.id}-${item.id}`}
                              className="flex items-center gap-3 rounded-md border border-zinc-200 p-2 dark:border-zinc-800"
                            >
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-12 w-12 rounded object-cover"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
                              )}
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p>
                                  {item.quantity} x Rs {item.price.toFixed(2)}{" "}
                                  = Rs{" "}
                                  {(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-semibold">
                          Delivery Address
                        </p>
                        {order.address ? (
                          <div className="text-sm text-zinc-700 dark:text-zinc-300">
                            <p>{order.address.name}</p>
                            <p>
                              {order.address.address},{" "}
                              {order.address.locality}
                            </p>
                            <p>
                              {order.address.city}, {order.address.state} -{" "}
                              {order.address.pincode}
                            </p>
                            <p>Mobile: {order.address.mobile}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-500">
                            Address not found.
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
