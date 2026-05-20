import { NextResponse } from "next/server";
import { forgotPassword } from "@/lib/services";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };

  if (!body.email) {
    return NextResponse.json(
      { message: "Email is required." },
      { status: 400 },
    );
  }

  forgotPassword(body.email);

  return NextResponse.json({
    message: "If this email exists, a reset link has been sent.",
  });
}

