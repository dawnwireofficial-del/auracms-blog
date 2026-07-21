import { NextResponse } from "next/server";
import { createAttribute } from "@/lib/auth-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.attributeName || "").trim();
    const value = String(body.attributeValue || "").trim();

    if (!name || !value) {
      return NextResponse.json({ message: "Attribute name and value are required" }, { status: 400 });
    }

    const attribute = createAttribute(name, value);

    return NextResponse.json({ message: "Attribute created", attribute }, { status: 201 });
  } catch (error) {
    console.error("CREATE_ATTRIBUTE_ERROR", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
