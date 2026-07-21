import { NextResponse } from "next/server";
import { createStaff, findStaffByEmail } from "@/lib/auth-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");
    const permissions = body.permissions as Record<string, string> | undefined;

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email address" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: "Confirm password does not match" }, { status: 400 });
    }

    const existing = findStaffByEmail(email);
    if (existing) {
      return NextResponse.json({ message: "Email already exists" }, { status: 409 });
    }

    const staff = await createStaff(name, email, password, permissions ?? {});

    return NextResponse.json({ message: "User created", user: staff }, { status: 201 });
  } catch (error) {
    console.error("CREATE_USER_ERROR", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
