import { NextResponse } from "next/server";
import { createCashfreePayment } from "@/lib/services";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    items?: Array<{
      id: number;
      name: string;
      price: number;
      quantity: number;
      image?: string;
    }>;
    addressId?: string | number;
    paymentMethod?: string;
    total?: number;
    customerEmail?: string;
    customerPhone?: string;
    couponCode?: string;
  };

  // ✅ Keep as string — addressId can be a MongoDB ObjectId
  const addressId = body.addressId != null ? String(body.addressId).trim() : '';

  const total =
    typeof body.total === "number"
      ? body.total
      : Number(body.total);

  const customerEmail = body.customerEmail?.trim();

  if (
    !body.items ||
    body.items.length === 0 ||
    !addressId ||                          // ✅ just check it's not empty
    body.paymentMethod?.trim() !== "cashfree" ||
    Number.isNaN(total) ||
    total <= 0 ||
    !customerEmail
  ) {
    return NextResponse.json(
      { message: "Invalid Cashfree payment payload." },
      { status: 400 }
    );
  }

  try {
    const payment = await createCashfreePayment({
      items: body.items,
      addressId,                           // ✅ pass as string
      paymentMethod: body.paymentMethod?.trim() ?? "cashfree",
      total,
      customerEmail,
      customerPhone: body.customerPhone?.trim(),
      couponCode: body.couponCode?.trim(),
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cashfree request failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}