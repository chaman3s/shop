"use client";
import { useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

type DiscountType = "percentage" | "flat";
type OfferType = "coupon" | "offer";

interface Coupon {
  id: string;
  type: OfferType;
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  active: boolean;
  createdAt: string;
}

// ── Seed data ──────────────────────────────────────────────────────────────────

const SEED: Coupon[] = [
  {
    id: "1",
    type: "coupon",
    code: "WELCOME20",
    title: "Welcome Discount",
    description: "20% off for first-time customers",
    discountType: "percentage",
    discountValue: 20,
    minOrder: 200,
    maxUses: 500,
    usedCount: 123,
    expiresAt: "2025-08-31",
    active: true,
    createdAt: "2025-05-01",
  },
  {
    id: "2",
    type: "offer",
    code: "FLAT50",
    title: "Flat ₹50 Off",
    description: "₹50 off on orders above ₹399",
    discountType: "flat",
    discountValue: 50,
    minOrder: 399,
    maxUses: 1000,
    usedCount: 670,
    expiresAt: "2025-06-30",
    active: true,
    createdAt: "2025-04-15",
  },
  {
    id: "3",
    type: "coupon",
    code: "MUNCH30",
    title: "Munch Special",
    description: "30% off on weekends",
    discountType: "percentage",
    discountValue: 30,
    minOrder: 500,
    maxUses: 200,
    usedCount: 200,
    expiresAt: "2025-05-15",
    active: false,
    createdAt: "2025-03-10",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const isExpired = (d: string) => new Date(d) < new Date();

const usagePercent = (used: number, max: number) =>
  Math.min(100, Math.round((used / max) * 100));

// ── Sub-components ─────────────────────────────────────────────────────────────

function Badge({ active, expired }: { active: boolean; expired: boolean }) {
  if (expired)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-900/30 px-2 py-0.5 text-[11px] font-semibold text-red-400 ring-1 ring-red-800">
        Expired
      </span>
    );
  if (active)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 ring-1 ring-emerald-800">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-400 ring-1 ring-zinc-700">
      Inactive
    </span>
  );
}

function TypePill({ type }: { type: OfferType }) {
  return (
    <span
      className={[
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        type === "coupon"
          ? "bg-violet-900/30 text-violet-300"
          : "bg-amber-900/30 text-amber-300",
      ].join(" ")}
    >
      {type}
    </span>
  );
}

// ── Shared input style (dark) ──────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────

const EMPTY: Omit<Coupon, "id" | "usedCount" | "createdAt"> = {
  type: "coupon",
  code: "",
  title: "",
  description: "",
  discountType: "percentage",
  discountValue: 10,
  minOrder: 0,
  maxUses: 100,
  expiresAt: "",
  active: true,
};

function Modal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Coupon | null;
  onSave: (c: Coupon) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Coupon, "id" | "usedCount" | "createdAt">>(
    initial
      ? {
          type: initial.type,
          code: initial.code,
          title: initial.title,
          description: initial.description,
          discountType: initial.discountType,
          discountValue: initial.discountValue,
          minOrder: initial.minOrder,
          maxUses: initial.maxUses,
          expiresAt: initial.expiresAt,
          active: initial.active,
        }
      : { ...EMPTY }
  );

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.code.trim() || !form.title.trim() || !form.expiresAt) return;
    onSave({
      id: initial?.id ?? uid(),
      usedCount: initial?.usedCount ?? 0,
      createdAt: initial?.createdAt ?? new Date().toISOString().slice(0, 10),
      ...form,
      code: form.code.toUpperCase().replace(/\s+/g, ""),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {initial ? "Edit" : "New"}
            </p>
            <h2 className="text-base font-bold text-white">
              {initial ? "Update Offer / Coupon" : "Create Offer / Coupon"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          {/* Type toggle */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Type
            </label>
            <div className="flex gap-2">
              {(["coupon", "offer"] as OfferType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => set("type", t)}
                  className={[
                    "flex-1 rounded-xl border py-2 text-sm font-semibold capitalize transition-colors",
                    form.type === t
                      ? t === "coupon"
                        ? "border-violet-600 bg-violet-900/30 text-violet-300"
                        : "border-amber-600 bg-amber-900/30 text-amber-300"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-750",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Field label="Title" required>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Weekend Special"
              className={inputCls}
            />
          </Field>

          <Field label="Coupon Code" required>
            <input
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="e.g. SAVE20"
              className={inputCls + " font-mono tracking-widest"}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short description shown to customers"
              rows={2}
              className={inputCls + " resize-none"}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Discount Type">
              <select
                value={form.discountType}
                onChange={(e) => set("discountType", e.target.value as DiscountType)}
                className={inputCls}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </Field>
            <Field
              label={form.discountType === "percentage" ? "Discount (%)" : "Discount (₹)"}
              required
            >
              <input
                type="number"
                min={1}
                max={form.discountType === "percentage" ? 100 : undefined}
                value={form.discountValue}
                onChange={(e) => set("discountValue", Number(e.target.value))}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Min. Order (₹)">
              <input
                type="number"
                min={0}
                value={form.minOrder}
                onChange={(e) => set("minOrder", Number(e.target.value))}
                className={inputCls}
              />
            </Field>
            {/* <Field label="Max Uses">
              <input
                type="number"
                min={1}
                value={form.maxUses}
                onChange={(e) => set("maxUses", Number(e.target.value))}
                className={inputCls}
              />
            </Field> */}
          </div>

          <Field label="Expiry Date" required>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => set("expiresAt", e.target.value)}
              className={inputCls}
            />
          </Field>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Active</p>
              <p className="text-xs text-zinc-400">
                Customers can use this {form.type}
              </p>
            </div>
            <button
              onClick={() => set("active", !form.active)}
              className={[
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                form.active ? "bg-emerald-500" : "bg-zinc-600",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                  form.active ? "translate-x-6" : "translate-x-1",
                ].join(" ")}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-zinc-800 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.code || !form.title || !form.expiresAt}
            className="flex-1 rounded-xl bg-white py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-40"
          >
            {initial ? "Save Changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────

function CouponCard({
  coupon,
  onEdit,
  onDelete,
  onToggle,
}: {
  coupon: Coupon;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const expired = isExpired(coupon.expiresAt);
  const pct = usagePercent(coupon.usedCount, coupon.maxUses);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-shadow hover:shadow-lg hover:shadow-black/40">
      {/* Top stripe */}
      <div
        className={[
          "h-1 w-full",
          expired
            ? "bg-red-600"
            : coupon.active
            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
            : "bg-zinc-700",
        ].join(" ")}
      />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <TypePill type={coupon.type} />
              <Badge active={coupon.active} expired={expired} />
            </div>
            <h3 className="mt-2 truncate text-base font-bold text-white">
              {coupon.title}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">{coupon.description}</p>
          </div>
          {/* Discount bubble */}
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-white text-zinc-900">
            <span className="text-lg font-extrabold leading-none">
              {coupon.discountType === "percentage"
                ? `${coupon.discountValue}%`
                : `₹${coupon.discountValue}`}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wide opacity-50">
              off
            </span>
          </div>
        </div>

        {/* Code */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-800 px-3 py-2">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-zinc-500">
            <path
              d="M9 15L15 9M9.5 9.5h.01M14.5 14.5h.01M3 7v3a1 1 0 001 1h.5M21 7v3a1 1 0 01-1 1h-.5M3 17v-3a1 1 0 011-1h.5M21 17v-3a1 1 0 00-1-1h-.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <code className="flex-1 font-mono text-sm font-bold tracking-widest text-zinc-100">
            {coupon.code}
          </code>
        </div>

        {/* Meta */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
          <span>Min order: ₹{coupon.minOrder}</span>
          <span>Expires: {fmtDate(coupon.expiresAt)}</span>
        </div>

        {/* Usage bar *
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Usage</span>
            <span>
              {coupon.usedCount} / {coupon.maxUses}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className={[
                "h-full rounded-full transition-all",
                pct >= 100
                  ? "bg-red-500"
                  : pct > 70
                  ? "bg-amber-400"
                  : "bg-emerald-500",
              ].join(" ")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>*/}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={onToggle}
            className="flex-1 rounded-xl border border-zinc-700 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
          >
            {coupon.active ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={onEdit}
            className="flex-1 rounded-xl border border-zinc-700 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="grid h-9 w-9 place-items-center rounded-xl border border-red-900/40 text-red-400 hover:bg-red-900/20"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OffersPage() {

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");

  const openCreate = () => { setEditing(null); setModal("create"); };
  const openEdit = (c: Coupon) => { setEditing(c); setModal("edit"); };
  const closeModal = () => setModal(null);

 const handleSave = async (c: Coupon) => {
  try {
    const isEdit = modal === "edit";

    const response = await fetch(
      isEdit
        ? `/api/admin/coupons/${c.id}`
        : "/api/admin/coupons",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: c.type,
          code: c.code,
          title: c.title,
          description: c.description,
          discountType: c.discountType,
          discountValue: c.discountValue,
          minOrder: c.minOrder,
          maxUses: c.maxUses,
          expiresAt: c.expiresAt,
          active: c.active,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong");
    }

    if (isEdit) {
      setCoupons((prev) =>
        prev.map((x) =>
          x.id === c.id ? data.coupon : x
        )
      );
    } else {
      setCoupons((prev) => [
        data.coupon,
        ...prev,
      ]);
    }

    closeModal();
  } catch (error) {
    console.error(error);
    alert("Failed to save coupon");
  }
};
 useEffect(() => {
  fetchCoupons();
}, []);

const fetchCoupons = async () => {
  try {
    setLoading(true);

    const response = await fetch("/api/admin/coupons");

    if (!response.ok) {
      throw new Error("Failed to fetch coupons");
    }

    const data = await response.json();

    setCoupons(data.coupons || []);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
  const handleDelete = async (id: string) => {
  try {
    const response = await fetch(
      `/api/admin/coupons/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete");
    }

    setCoupons((prev) =>
      prev.filter((c) => c.id !== id)
    );
  } catch (error) {
    console.error(error);
    alert("Failed to delete coupon");
  }
};

const handleToggle = async (id: string) => {
  try {
    const response = await fetch(
      `/api/admin/coupons/${id}/toggle`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed");
    }

    setCoupons((prev) =>
      prev.map((c) =>
        c.id === id ? data.coupon : c
      )
    );
  } catch (error) {
    console.error(error);
    alert("Failed to toggle coupon");
  }
};
if (loading) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="text-white text-lg">
        Loading coupons...
      </p>
    </div>
  );
}
  const filtered = coupons.filter((c) => {
    if (filter === "active") return c.active && !isExpired(c.expiresAt);
    if (filter === "expired") return isExpired(c.expiresAt) || !c.active;
    return true;
  });

  const stats = {
    total: coupons.length,
    active: coupons.filter((c) => c.active && !isExpired(c.expiresAt)).length,
    expired: coupons.filter((c) => isExpired(c.expiresAt)).length,
    totalUses: coupons.reduce((s, c) => s + c.usedCount, 0),
  };

  return (
    <>
      {/* ── Page wrapper — matches your zinc-950 dashboard bg ── */}
      <div className="min-h-screen bg-zinc-950 p-4 md:p-8">

        {/* Page header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Admin Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-white">
              Offers &amp; Coupons
            </h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            New Offer / Coupon
          </button>
        </div>

        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: stats.total },
            { label: "Active", value: stats.active },
            { label: "Expired", value: stats.expired },
            { label: "Total Uses", value: stats.totalUses },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-extrabold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="mb-5 flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {(["all", "active", "expired"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                "rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition-colors",
                filter === f
                  ? "bg-white text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-200",
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 py-20">
            <p className="text-3xl">🎟️</p>
            <p className="mt-3 font-semibold text-zinc-500">No coupons found</p>
            <button
              onClick={openCreate}
              className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
            >
              Create one
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => (
              <CouponCard
                key={c.id}
                coupon={c}
                onEdit={() => openEdit(c)}
                onDelete={() => handleDelete(c.id)}
                onToggle={() => handleToggle(c.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          initial={modal === "edit" ? editing : null}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </>
  );
}