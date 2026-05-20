"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  onLogout?: never;
}

const links = [
  {
    href: "/admin/dashboard",
    label: "Orders",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <path
          d="M7 7h14M7 12h14M7 17h14M3 7h.01M3 12h.01M3 17h.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <path
          d="M4 19V5M8 19v-6m4 6V9m4 10v-3m4 3V7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/admin/inventory",
    label: "Inventory",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <path
          d="M21 8.5 12 3 3 8.5 12 14l9-5.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 8.5V16l9 5.5 9-5.5V8.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 14v7.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/admin/manage",
    label: "Manage Content",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <path
          d="M12 6V4m0 16v-2M6 12H4m16 0h-2M7.757 7.757 6.343 6.343m11.314 11.314-1.414-1.414M16.243 7.757l1.414-1.414M6.343 17.657l1.414-1.414"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 15a3 3 0 100-6 3 3 0 000 6Z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
  href: "/admin/offers",
  label: "Offers & Coupons",
  icon: (
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
      d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2m8-8h2a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-2"
    />
  </svg>
),
}
];

export default function AdminSidebar(props: AdminSidebarProps) {
  void props;
  const pathname = usePathname();

  return (
    <aside className="w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:w-72 md:self-start md:sticky md:top-8 md:h-[calc(100vh-4rem)]">
      <div className="flex h-full flex-col">
        <div className="border-b border-zinc-200 bg-gradient-to-r from-zinc-950 to-zinc-800 px-5 py-5 text-white dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Admin Panel
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <span className="text-sm font-bold">M</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Munch</p>
              <p className="truncate text-xs text-white/70">Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-auto p-3">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Menu
          </p>
          <div className="space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "grid h-9 w-9 place-items-center rounded-xl",
                      isActive
                        ? "bg-white/10 dark:bg-zinc-200"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {link.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{link.label}</span>
                  <span
                    className={[
                      "h-2 w-2 rounded-full transition-opacity",
                      isActive
                        ? "bg-emerald-400 opacity-100 dark:bg-emerald-500"
                        : "bg-zinc-400 opacity-0 group-hover:opacity-100 dark:bg-zinc-600",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-zinc-200 p-4 text-xs text-zinc-500 dark:border-zinc-800">
          Logged in as admin
        </div>
      </div>
    </aside>
  );
}

