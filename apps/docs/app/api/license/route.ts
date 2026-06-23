import { NextRequest, NextResponse } from "next/server";
import { validateLicense } from "../../../lib/creem";

export async function POST(req: NextRequest) {
  try {
    const { licenseKey } = await req.json();

    if (!licenseKey) {
      return NextResponse.json(
        { error: "License key is required" },
        { status: 400 }
      );
    }

    const result = await validateLicense(licenseKey);

    return NextResponse.json(result);
  } catch (error) {
    console.error("License validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate license" },
      { status: 500 }
    );
  }
}
