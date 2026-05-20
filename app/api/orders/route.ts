import { NextResponse } from "next/server";
import { createOrder, getAllOrders } from "@/lib/services";

export async function GET() {
  return NextResponse.json({
    orders: await getAllOrders(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    customerEmail?: string;
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
  };

  const addressId = Number(body.addressId);

  if (
    !body.items ||
    body.items.length === 0 ||
    Number.isNaN(addressId) ||
    !body.paymentMethod ||
    typeof body.total !== "number"
  ) {
    return NextResponse.json(
      { message: "Invalid order payload." },
      { status: 400 }
    );
  }

  const order = await createOrder({
    customerEmail:
      body.customerEmail?.trim().toLowerCase() ||
      undefined,

    items: body.items,

    addressId,

    paymentMethod: body.paymentMethod,

    total: body.total,
  });

  return NextResponse.json(
    { order },
    { status: 201 }
  );
}