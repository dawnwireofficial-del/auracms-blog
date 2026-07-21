import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { consumeResetToken, findUserById, updatePassword } from "@/lib/auth-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = String(body.token || "");
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!token || !password || !confirmPassword) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: "Confirm password does not match" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const record = consumeResetToken(tokenHash);

    if (!record) {
      return NextResponse.json(
        { message: "Reset link is invalid or expired" },
        { status: 400 }
      );
    }

    const user = findUserById(record.userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    updatePassword(user.id, passwordHash);

    return NextResponse.json({ message: "Password reset successful" }, { status: 200 });
  } catch (error) {
    console.error("RESET_PASSWORD_ERROR", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
  