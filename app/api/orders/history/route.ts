import { NextResponse } from "next/server";
import { getOrdersByCustomerEmail } from "@/lib/services";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email") ?? "";
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return NextResponse.json({ message: "Email is required." }, { status: 400 });
  }

  const orders = await getOrdersByCustomerEmail(normalizedEmail);
  return NextResponse.json({ orders });
}

