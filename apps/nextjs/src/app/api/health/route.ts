import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      message: "QuickCarousals API is running",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
