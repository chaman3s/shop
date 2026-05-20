"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type ProductNotification = {
  id: number;
  name: string;
  stockQuantity?: number;
  inStock?: boolean;
};

export default function AdminNotificationsBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ProductNotification[]>([]);
  const buttonId = useId();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/products");
        if (!response.ok) {
          return;
        }
        const body = (await response.json()) as { products?: ProductNotification[] };
        const products = Array.isArray(body.products) ? body.products : [];
        const outOfStock = products
          .filter((p) => {
            const qty = Number(p.stockQuantity) || 0;
            const inStock = Boolean(p.inStock);
            return !inStock || qty <= 0;
          })
          .map((p) => ({
            id: p.id,
            name: p.name,
            stockQuantity: Number(p.stockQuantity) || 0,
            inStock: Boolean(p.inStock),
          }));

        if (!cancelled) {
          setItems(outOfStock);
        }
      } catch {
        // ignore notification fetch failures
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !menuRef.current) {
        return;
      }
      if (!menuRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  const count = items.length;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={buttonId}
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        title="Notifications"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white">
            {count > 99 ? "99+" : String(count)}
          </span>
        ) : null}
      </button>

      {open && (
        <div
          id={buttonId}
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-900">
            <p className="text-sm font-semibold">Notifications</p>
            <Link
              href="/admin/inventory"
              className="text-xs font-semibold text-zinc-700 hover:underline dark:text-zinc-300"
              onClick={() => setOpen(false)}
            >
              Inventory
            </Link>
          </div>

          {loading ? (
            <div className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">
              No new notifications.
            </div>
          ) : (
            <div className="max-h-72 overflow-auto">
              {items.map((p) => (
                <div
                  key={p.id}
                  role="menuitem"
                  className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-amber-900 dark:text-amber-200">
                      Out of stock
                    </p>
                    <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                      {p.name}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Qty {Number(p.stockQuantity) || 0}
                    </p>
                  </div>
                  <Link
                    href="/admin/inventory"
                    className="shrink-0 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/55"
                    onClick={() => setOpen(false)}
                  >
                    Fix
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

