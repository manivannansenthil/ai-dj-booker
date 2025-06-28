import { NextRequest, NextResponse } from "next/server";
import { blandCallResults } from "../bland-webhook/route";

export async function GET(req: NextRequest) {
  return NextResponse.json({ results: blandCallResults });
}
