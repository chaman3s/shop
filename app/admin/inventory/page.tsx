"use client";

import AdminSidebar from "../components/AdminSidebar";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNotificationsBell from "../components/AdminNotificationsBell";

type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  weight: string;
  stockQuantity: number;
  inStock: boolean;
};

function formatCurrencyINR(value: number) {
  return `Rs ${value.toFixed(2)}`;
}

export default function AdminInventoryPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [draftQty, setDraftQty] = useState<Record<number, string>>({});

  useEffect(() => {
    const isAdminLoggedIn =
      localStorage.getItem("munch_admin_logged_in") === "true";
    if (!isAdminLoggedIn) {
      router.replace("/admin/login?redirect=/admin/inventory");
      return;
    }
    setIsCheckingAuth(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("munch_admin_logged_in");
    router.replace("/admin/login");
  };

  const refreshProducts = async () => {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error("Failed to fetch products.");
    }
    const body = (await response.json()) as { products: Product[] };
    setProducts(Array.isArray(body.products) ? body.products : []);
  };

  useEffect(() => {
    if (isCheckingAuth) {
      return;
    }
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        await refreshProducts();
      } catch (fetchError) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to fetch products.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [isCheckingAuth]);

  const outOfStock = useMemo(
    () => products.filter((p) => !p.inStock || (Number(p.stockQuantity) || 0) <= 0),
    [products],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return products;
    }
    return products.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        String(p.id).includes(q)
      );
    });
  }, [products, query]);

  const updateInventory = async (
    productId: number,
    payload: { inStock?: boolean; stockQuantity?: number },
  ) => {
    try {
      setUpdatingId(productId);
      setError("");
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message || "Failed to update stock.");
      }
      const body = (await response.json()) as { product: Product };
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? body.product : p)),
      );
      setDraftQty((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : "Failed to update stock.";
      setError(message);
    } finally {
      setUpdatingId(null);
    }
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

        <div className="flex-1 space-y-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Admin Dashboard
              </p>
              <h1 className="mt-1 text-2xl font-bold">Inventory</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Manage stock availability for products.
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

          {outOfStock.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
              <p className="text-sm font-semibold">
                Alert: {outOfStock.length} product
                {outOfStock.length === 1 ? "" : "s"} out of stock
              </p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                Mark them in stock when you have inventory again.
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </p>
          )}

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Products</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {products.length}
                </span>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, category, id..."
                className="w-full sm:w-80 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400/40 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-500/30"
              />
            </div>

            {loading ? (
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Loading products...
              </p>
            ) : filtered.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                No products found.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {p.name}
                        </p>
                        <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                          #{p.id} · {p.category} · {formatCurrencyINR(p.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span
                        className={[
                          "rounded-full border px-3 py-1 text-xs font-semibold",
                          p.inStock
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
                            : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100",
                        ].join(" ")}
                      >
                        {p.inStock ? "In stock" : "Out of stock"} · Qty{" "}
                        {Number(p.stockQuantity) || 0}
                      </span>

                      <div className="flex items-center gap-2">
                        <input
                          inputMode="numeric"
                          value={draftQty[p.id] ?? String(Number(p.stockQuantity) || 0)}
                          onChange={(e) =>
                            setDraftQty((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          className="w-24 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400/40 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-500/30"
                          aria-label="Stock quantity"
                        />
                        <button
                          type="button"
                          disabled={updatingId === p.id}
                          onClick={() => {
                            const raw = (draftQty[p.id] ?? "").trim();
                            const qty = raw === "" ? Number(p.stockQuantity) || 0 : Number(raw);
                            updateInventory(p.id, { stockQuantity: qty });
                          }}
                          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                        >
                          {updatingId === p.id ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
