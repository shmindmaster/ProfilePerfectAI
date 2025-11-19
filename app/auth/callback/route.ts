import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const next = requestUrl.searchParams.get("next") || "/";
  return NextResponse.redirect(new URL(next, req.url));
}
