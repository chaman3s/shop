import { NextRequest, NextResponse } from "next/server";
import * as actions from "@/lib/services";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, cartTotal } = body;

    if (!code || typeof cartTotal !== "number") {
      return NextResponse.json(
        { error: "code (string) and cartTotal (number) are required." },
        { status: 400 },
      );
    }

    const result = await actions.applyCoupon(String(code), Number(cartTotal));

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      discountAmount: result.discountAmount,
      coupon: result.coupon,
    });
  } catch (err) {
    console.error("[POST /api/coupons/apply]", err);
    return NextResponse.json({ error: "Failed to apply coupon." }, { status: 500 });
  }
}