import { NextResponse } from "next/server";
import { listDirectory } from "@/lib/data-store";

export async function GET() {
  return NextResponse.json({ directory: await listDirectory() });
}
