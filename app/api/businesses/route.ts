import { NextResponse } from "next/server";
import { listDirectory } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ directory: listDirectory() });
}
