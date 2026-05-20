'use client';

import Link from 'next/link';

interface SuccessPageProps {
  searchParams: {
    orderId?: string;
    tx_status?: string;
    reference_id?: string;
  };
}

export default function PaymentSuccessPage({ searchParams }: SuccessPageProps) {
  const isSuccess = searchParams.tx_status === 'SUCCESS';
  const orderId = searchParams.orderId;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-10 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600 dark:bg-green-900 dark:text-green-200">
            ✓
          </div>
          <h1 className="text-3xl font-semibold mb-3 text-zinc-900 dark:text-white">
            {isSuccess ? 'Payment successful' : 'Payment completed'}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            {isSuccess
              ? 'Thank you for your purchase. Your order is being processed.'
              : 'We received your payment details. Please check your order status in the My Orders section.'}
          </p>
          {orderId && (
            <div className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              <p className="font-semibold">Order ID</p>
              <p>{orderId}</p>
            </div>
          )}
          <Link
            href="/"
            className="inline-flex rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
