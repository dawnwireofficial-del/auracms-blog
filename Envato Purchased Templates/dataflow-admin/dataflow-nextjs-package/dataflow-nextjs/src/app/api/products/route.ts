import { NextResponse } from "next/server";
import { createProduct, updateProduct } from "@/lib/auth-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const title = String(body.title || "").trim();
    const price = parseFloat(body.price);

    if (!title || isNaN(price)) {
      return NextResponse.json({ message: "Title and price are required" }, { status: 400 });
    }

    const product = createProduct({
      title,
      price,
      sale_price: body.salePrice ? parseFloat(body.salePrice) : null,
      date: body.date || null,
      brand: body.brand || null,
      sku: body.sku || null,
      stock: body.stock || null,
      tags: body.tags || null,
      description: body.description || null,
      color: body.color || null,
      size: body.size || null,
      categories: body.categories ? JSON.stringify(body.categories) : null,
    });

    return NextResponse.json({ message: "Product created", product }, { status: 201 });
  } catch (error) {
    console.error("CREATE_PRODUCT_ERROR", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const id = String(body.id || "").trim();
    const title = String(body.title || "").trim();
    const price = parseFloat(body.price);

    if (!id || !title || isNaN(price)) {
      return NextResponse.json({ message: "ID, title and price are required" }, { status: 400 });
    }

    updateProduct(id, {
      title,
      price,
      sale_price: body.salePrice ? parseFloat(body.salePrice) : null,
      date: body.date || null,
      brand: body.brand || null,
      sku: body.sku || null,
      stock: body.stock || null,
      tags: body.tags || null,
      description: body.description || null,
      color: body.color || null,
      size: body.size || null,
      categories: body.categories ? JSON.stringify(body.categories) : null,
    });

    return NextResponse.json({ message: "Product updated" });
  } catch (error) {
    console.error("UPDATE_PRODUCT_ERROR", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
