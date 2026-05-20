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
  };

  const addressId = Number(body.addressId);

  const total =
    typeof body.total === "number"
      ? body.total
      : Number(body.total);

  const customerEmail = body.customerEmail?.trim();

  if (
    !body.items ||
    body.items.length === 0 ||
    Number.isNaN(addressId) ||
    body.paymentMethod?.trim() !== "cashfree" ||
    Number.isNaN(total) ||
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
      addressId,
      paymentMethod:
        body.paymentMethod?.trim() ?? "cashfree",
      total,
      customerEmail,
      customerPhone: body.customerPhone?.trim(),
    });

    return NextResponse.json(payment, {
      status: 201,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Cashfree request failed.";

    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}