
import { NextRequest, NextResponse } from "next/server";
import * as actions from "@/lib/services";

type Params = { params: { id: string } };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const result = await actions.toggleCouponActive(params.id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ coupon: result.coupon });
  } catch (err) {
    console.error("[POST /api/admin/coupons/:id/toggle]", err);
    return NextResponse.json({ error: "Failed to toggle coupon." }, { status: 500 });
  }
}