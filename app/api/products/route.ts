import { NextResponse } from "next/server";
import { addProduct, getAllProducts } from "@/lib/services";

export async function GET() {
  return NextResponse.json({ products: await getAllProducts() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    price?: number;
    image?: string;
    description?: string;
    category?: string;
    weight?: string;
    stockQuantity?: number;
  };

  if (
    !body.name ||
    typeof body.price !== "number" ||
    !body.image
  ) {
    return NextResponse.json(
      { message: "Name, price, and image are required." },
      { status: 400 },
    );
  }

  const result = await addProduct({
    name: body.name,
    price: body.price,
    image: body.image,
    description: body.description,
    category: body.category,
    weight: body.weight,
    stockQuantity: body.stockQuantity,
  });

  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: 400 });
  }

  return NextResponse.json({ product: result.product }, { status: 201 });
}
