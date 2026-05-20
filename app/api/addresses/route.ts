import { NextResponse } from "next/server";
import { addAddress, getAddresses } from "@/lib/services";

export async function GET() {
  const addresses = await getAddresses();
  const normalizedAddresses = addresses.map((address) => ({
    ...address,
    id: String(address.id),
  }));
  return NextResponse.json({ addresses: normalizedAddresses });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    mobile?: string;
    pincode?: string;
    address?: string;
    locality?: string;
    city?: string;
    state?: string;
    addressType?: "home" | "work";
  };

  if (
    !body.name ||
    !body.mobile ||
    !body.pincode ||
    !body.address ||
    !body.locality ||
    !body.city ||
    !body.state ||
    !body.addressType
  ) {
    return NextResponse.json(
      { message: "All address fields are required." },
      { status: 400 },
    );
  }

  const created = await addAddress({
    name: body.name,
    mobile: body.mobile,
    pincode: body.pincode,
    address: body.address,
    locality: body.locality,
    city: body.city,
    state: body.state,
    addressType: body.addressType,
  });

  return NextResponse.json({ address: created }, { status: 201 });
}

