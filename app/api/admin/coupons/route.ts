
import { NextRequest, NextResponse } from "next/server";
import * as actions from "@/lib/services";

// ── GET — list all ────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const coupons = await actions.getAllCoupons();
    return NextResponse.json({ coupons });
  } catch (err) {
    console.error("[GET /api/admin/coupons]", err);
    return NextResponse.json({ error: "Failed to fetch coupons." }, { status: 500 });
  }
}

// ── POST — create ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type,
      code,
      title,
      description = "",
      discountType,
      discountValue,
      minOrder = 0,
      maxUses = 0,
      expiresAt,
      active = true,
    } = body;

    if (!type || !code || !title || !discountType || !discountValue || !expiresAt) {
      return NextResponse.json(
        { error: "type, code, title, discountType, discountValue and expiresAt are required." },
        { status: 400 },
      );
    }

    const result = await actions.createCoupon({
      type,
      code,
      title,
      description,
      discountType,
      discountValue: Number(discountValue),
      minOrder: Number(minOrder),
      maxUses: Number(maxUses),
      expiresAt,
      active,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ coupon: result.coupon }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/coupons]", err);
    return NextResponse.json({ error: "Failed to create coupon." }, { status: 500 });
  }
}