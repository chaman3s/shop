import { NextResponse } from "next/server";
import { returnOrder } from "@/lib/services";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Invalid order id." }, { status: 400 });
  }

  const body = (await request.json()) as { email?: string };
  if (!body.email) {
    return NextResponse.json({ message: "Email is required." }, { status: 400 });
  }

  const result = await returnOrder(id, body.email);
  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: 400 });
  }

  return NextResponse.json({ order: result.order });
}