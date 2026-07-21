import { NextResponse } from "next/server";
import { getStoreSettings, saveStoreSettings } from "@/lib/auth-db";

export async function GET() {
  try {
    const settings = getStoreSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET_STORE_SETTINGS_ERROR", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    saveStoreSettings(body);
    return NextResponse.json({ message: "Store settings saved" });
  } catch (error) {
    console.error("SAVE_STORE_SETTINGS_ERROR", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
