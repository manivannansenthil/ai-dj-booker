import { NextResponse } from "next/server";
import { blandCallResults } from "../bland-webhook/route";

export async function GET() {
  return NextResponse.json({ results: blandCallResults });
}
