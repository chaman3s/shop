import { NextResponse } from "next/server";
import { adminLogin } from "@/lib/services";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  if (!body.email || !body.password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 },
    );
  }

  const result = adminLogin(body.email, body.password);
  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: 401 });
  }

  return NextResponse.json(result);
}

