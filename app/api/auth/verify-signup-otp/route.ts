import { NextResponse } from "next/server";
import { verifySignupOtp } from "@/lib/services";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    otp?: string;
  };

  if (!body.email || !body.otp) {
    return NextResponse.json(
      { message: "Email and OTP are required." },
      { status: 400 },
    );
  }

  const result = await verifySignupOtp(body.email, body.otp);
  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: 401 });
  }

  return NextResponse.json(result, { status: 201 });
}

