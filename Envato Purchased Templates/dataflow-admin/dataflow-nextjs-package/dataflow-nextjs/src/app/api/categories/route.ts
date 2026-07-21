import { NextResponse } from "next/server";
import { createCategory } from "@/lib/auth-db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = String(formData.get("categoryName") || "").trim();

    if (!name) {
      return NextResponse.json({ message: "Category name is required" }, { status: 400 });
    }

    let imageUrl: string | undefined;
    const file = formData.get("filename") as File | null;

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop() ?? "jpg";
      const filename = `${randomUUID()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "categories");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      imageUrl = `/uploads/categories/${filename}`;
    }

    const category = createCategory(name, imageUrl);

    return NextResponse.json({ message: "Category created", category }, { status: 201 });
  } catch (error) {
    console.error("CREATE_CATEGORY_ERROR", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
