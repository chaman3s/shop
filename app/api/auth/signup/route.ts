import { NextResponse } from "next/server";
import { startSignupWithOtp } from "@/lib/services";
import { sendOtpEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!body.name || !body.email || !body.password) {
    return NextResponse.json(
      { message: "Name, email, and password are required." },
      { status: 400 },
    );
  }

  const result = await startSignupWithOtp(body.name, body.email, body.password);
  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: 409 });
  }

  const emailResult = await sendOtpEmail({
    to: result.email,
    otp: result.otp,
    purpose: "signup",
  });
  if (!emailResult.sent) {
    console.log(`[mock-email] Signup OTP for ${result.email}: ${result.otp}`);
  }

  const emailReason = emailResult.sent
    ? undefined
    : emailResult.reason?.includes("domain not verified")
    ? "Email domain not verified. Using Dev OTP."
    : "Email delivery failed. Using Dev OTP.";

  return NextResponse.json({
    message: emailResult.sent
      ? "OTP sent to your email."
      : "Email service not configured. Use Dev OTP for now.",
    email: result.email,
    devOtp: result.otp,
    emailSent: emailResult.sent,
    emailReason,
  });
}
