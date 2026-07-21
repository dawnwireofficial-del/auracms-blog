import { NextResponse } from "next/server";
import crypto from "crypto";
import { findUserByEmail, upsertResetToken } from "@/lib/auth-db";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();

    const genericOk = NextResponse.json(
      { message: "If the email exists, a reset link will be sent." },
      { status: 200 }
    );

    if (!email) return genericOk;

    const user = findUserByEmail(email);
    if (!user) return genericOk;

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); 

    upsertResetToken(user.id, tokenHash, expiresAt);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail(email, resetLink);
    } catch (mailError) {
      console.error("MAIL_ERROR", mailError);
      console.log("RESET LINK (mail failed):", resetLink);
    }

    return genericOk;
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
