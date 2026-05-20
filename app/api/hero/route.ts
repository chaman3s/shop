import { NextResponse } from "next/server";
import { getHero, updateHero } from "@/lib/services";

export async function GET() {
  return NextResponse.json({ hero: await getHero() });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
  };

  if (!body.title || !body.subtitle || !body.imageUrl) {
    return NextResponse.json(
      { message: "Title, subtitle and image URL are required." },
      { status: 400 },
    );
  }

  const result = await updateHero({
    title: body.title,
    subtitle: body.subtitle,
    imageUrl: body.imageUrl,
  });

  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: 400 });
  }

  return NextResponse.json({ hero: result.hero });
}

