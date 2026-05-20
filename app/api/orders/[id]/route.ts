import { NextResponse } from "next/server";
import { cancelOrder, cancelOrderAdmin, updateOrderStatus,returnOrder  } from "@/lib/services";


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orderId = id;
  if (!orderId) {
    return NextResponse.json({ message: "Invalid order id." }, { status: 400 });
  }

  const body = (await request.json()) as {
    status?:
      | "pending"
      | "confirmed"
      | "shipped"
      | "delivered"
      | "cancelled"
      | "return_requested"
      | "returned";
    email?: string;
  };

  if (!body.status) {
    return NextResponse.json({ message: "Status is required." }, { status: 400 });
  }

  const result =
    body.status === "cancelled" && body.email
      ? await cancelOrder(orderId, body.email)
      : body.status === "cancelled"
        ? await cancelOrderAdmin(orderId)
        : await updateOrderStatus(orderId, body.status);
  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: 404 });
  }

  return NextResponse.json({ order: result.order });
}

