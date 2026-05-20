import { NextRequest, NextResponse } from "next/server";
import * as actions from "@/lib/services";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// ── GET ─────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    const coupons = await actions.getAllCoupons();

    const coupon = coupons.find((c) => c.id === id);

    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ coupon });
  } catch (err) {
    console.error("[GET /api/admin/coupons/:id]", err);

    return NextResponse.json(
      { error: "Failed to fetch coupon." },
      { status: 500 }
    );
  }
}

// ── PATCH ───────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const result = await actions.updateCoupon(id, body);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      coupon: result.coupon,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/coupons/:id]", err);

    return NextResponse.json(
      { error: "Failed to update coupon." },
      { status: 500 }
    );
  }
}

// ── DELETE ──────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    const result = await actions.deleteCoupon(id);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: result.id,
    });
  } catch (err) {
    console.error("[DELETE /api/admin/coupons/:id]", err);

    return NextResponse.json(
      { error: "Failed to delete coupon." },
      { status: 500 }
    );
  }
}

