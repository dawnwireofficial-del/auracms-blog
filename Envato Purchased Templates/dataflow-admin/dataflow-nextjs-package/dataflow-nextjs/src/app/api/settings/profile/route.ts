import { NextResponse } from "next/server";
import { getProfileSettings, saveProfileSettings } from "@/lib/auth-db";

export async function GET() {
  try {
    const settings = getProfileSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET_PROFILE_SETTINGS_ERROR", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    saveProfileSettings(body);
    return NextResponse.json({ message: "Profile settings saved" });
  } catch (error) {
    console.error("SAVE_PROFILE_SETTINGS_ERROR", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
