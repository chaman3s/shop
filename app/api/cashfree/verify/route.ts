import { NextResponse } from "next/server";
import { verifyCashfreePayment } from "@/lib/services";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const orderId = url.searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          message: "orderId is required",
        },
        { status: 400 }
      );
    }

    const result = await verifyCashfreePayment(orderId);

    return NextResponse.json(
      {
        ok: result.ok,
        paymentStatus: result.paymentStatus,
        providerStatus: result.providerStatus,
        raw: result.raw,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/cashfree/verify]", err);

    return NextResponse.json(
      {
        ok: false,
        paymentStatus: "failed",
        message:
          err instanceof Error
            ? err.message
            : "Verification failed",
      },
      { status: 500 }
    );
  }
}