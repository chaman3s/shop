import Link from "next/link";
import { verifyCashfreePayment } from "@/lib/services";

export const dynamic = "force-dynamic";

interface PaymentStatusPageProps {
  searchParams: Promise<{
    orderId?: string;
    tx_status?: string;
    reference_id?: string;
  }>;
}

export default async function PaymentStatusPage({
  searchParams,
}: PaymentStatusPageProps) {
  const resolvedSearchParams = await searchParams;
  const orderId = resolvedSearchParams.orderId?.trim();
  const referenceId = resolvedSearchParams.reference_id?.trim();

  let paymentStatus: "success" | "failed" | "pending" = "failed";
  let providerStatus: string | undefined;
  let errorMessage: string | undefined;

 // AFTER
if (orderId) {
  try {
    const verification = await verifyCashfreePayment(orderId);
    providerStatus = verification.providerStatus || undefined;

    // Treat ACTIVE as failed — user abandoned the payment page
    if (providerStatus === "ACTIVE") {
      paymentStatus = "failed";
      errorMessage = "Payment was not completed. Your order has been cancelled.";
    } else {
      paymentStatus = verification.paymentStatus;
    }
  } catch {
    paymentStatus = "failed";
    errorMessage = "Unable to verify payment. Please contact support.";
  }
}

  const isSuccess = paymentStatus === "success";
  const isPending = paymentStatus === "pending";
  const isFailed = paymentStatus === "failed";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {/* Icon */}
        <div
          className={[
            "mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full",
            isSuccess
              ? "bg-emerald-100 dark:bg-emerald-950"
              : isPending
                ? "bg-amber-100 dark:bg-amber-950"
                : "bg-red-100 dark:bg-red-950",
          ].join(" ")}
        >
          {isSuccess ? (
            <svg
              className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
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
          ) : isPending ? (
            <svg
              className="h-8 w-8 animate-spin text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
            >
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
          ) : (
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-xl font-semibold text-zinc-900 dark:text-white">
          {isSuccess
            ? "Payment successful"
            : isPending
              ? "Verifying payment"
              : "Payment failed"}
        </h1>

        {/* Description */}
        <p className="mb-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {isSuccess
            ? "Your order has been confirmed. Thank you for your purchase!"
            : isPending
              ? "We're still verifying your payment with the gateway. Please refresh in a few seconds."
              : errorMessage ??
                "Your payment could not be completed. The order has been cancelled."}
        </p>

        {/* Order / reference info */}
        {(orderId || referenceId || providerStatus) && (
          <div className="mb-6 space-y-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            {orderId && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Order ID
                </span>
                <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                  #{orderId.slice(-8).toUpperCase()}
                </span>
              </div>
            )}
            {referenceId && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Reference
                </span>
                <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                  {referenceId}
                </span>
              </div>
            )}
            {providerStatus && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Gateway status
                </span>
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    isSuccess
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : isPending
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
                  ].join(" ")}
                >
                  {providerStatus}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {isSuccess && (
            <>
              <Link
                href="/orders"
                className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                View my orders
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Continue shopping
              </Link>
            </>
          )}

          {isPending && (
            <>
              <Link
                href={
                  orderId
                    ? `/payment/status?orderId=${encodeURIComponent(orderId)}`
                    : "/payment/status"
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh status
              </Link>
              <Link
                href="/orders"
                className="flex items-center justify-center rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                View my orders
              </Link>
            </>
          )}

          {isFailed && (
            <>
              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Try again
              </Link>
              <Link
                href="/orders"
                className="flex items-center justify-center rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                View my orders
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Continue shopping
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}