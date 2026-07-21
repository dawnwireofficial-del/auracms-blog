import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { findUserByEmail } from "@/lib/auth-db";

type LoginBody = {
  email?: string;
  password?: string;
  keepSignedIn?: boolean;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { message: "Please enter email and password" },
        { status: 400 }
      );
    }

    const user = findUserByEmail(email);

    if (!user || !user.password_hash) {
      return NextResponse.json(
        { message: "Email or password is incorrect" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json(
        { message: "Email or password is incorrect" },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const maxAge = body.keepSignedIn
      ? 60 * 60 * 24 * 30
      : 60 * 60 * 24;

    cookieStore.set("admin_token", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return NextResponse.json({ message: "Login successful" });
  } catch (error) {
    console.error("LOGIN_ERROR", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
