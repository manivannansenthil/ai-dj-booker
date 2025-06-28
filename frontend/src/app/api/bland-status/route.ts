import { NextResponse } from "next/server";
import { blandCallResults } from "../bland-memory";

export async function GET() {
  return NextResponse.json({ results: blandCallResults });
}
