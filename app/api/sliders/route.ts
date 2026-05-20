import { NextResponse } from "next/server";
import { getSliders, replaceSliders } from "@/lib/services";

export async function GET() {
  return NextResponse.json({ sliders: await getSliders() });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    sliders?: Array<{
      id?: number;
      url?: string;
      title?: string;
      subtitle?: string;
    }>;
  };

  if (!body.sliders || body.sliders.length === 0) {
    return NextResponse.json(
      { message: "Sliders are required." },
      { status: 400 },
    );
  }

  const result = await replaceSliders(
    body.sliders.map((item, index) => ({
      id: item.id ?? index + 1,
      url: item.url ?? "",
      title: item.title ?? "",
      subtitle: item.subtitle ?? "",
    })),
  );

  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: 400 });
  }

  return NextResponse.json({ sliders: result.sliders });
}

