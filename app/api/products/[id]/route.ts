import { NextResponse } from "next/server";
import { deleteProductById, getProductDetails, updateProductStock } from "@/lib/services";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const productId = Number.parseInt(id, 10);
  if (Number.isNaN(productId)) {
    return NextResponse.json(
      { message: "Invalid product id." },
      { status: 400 },
    );
  }

  const details = await getProductDetails(productId);
  if (!details) {
    return NextResponse.json({ message: "Product not found." }, { status: 404 });
  }

  return NextResponse.json(details);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const productId = Number.parseInt(id, 10);
  if (Number.isNaN(productId)) {
    return NextResponse.json(
      { message: "Invalid product id." },
      { status: 400 },
    );
  }

  const result = await deleteProductById(productId);
  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: 404 });
  }

  return NextResponse.json({ product: result.product });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const productId = Number.parseInt(id, 10);
  if (Number.isNaN(productId)) {
    return NextResponse.json(
      { message: "Invalid product id." },
      { status: 400 },
    );
  }

  const body = (await request.json()) as { inStock?: boolean; stockQuantity?: number };
  const hasInStock = typeof body.inStock === "boolean";
  const hasStockQuantity = typeof body.stockQuantity === "number";
  if (!hasInStock && !hasStockQuantity) {
    return NextResponse.json(
      { message: "inStock(boolean) or stockQuantity(number) is required." },
      { status: 400 },
    );
  }

  const result = await updateProductStock(productId, {
    inStock: hasInStock ? body.inStock : undefined,
    stockQuantity: hasStockQuantity ? body.stockQuantity : undefined,
  });
  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: 404 });
  }

  return NextResponse.json({ product: result.product });
}
