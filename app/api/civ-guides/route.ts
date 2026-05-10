import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const filePath = join(process.cwd(), "lib", "civ-guides.json");

export async function GET() {
  const raw = readFileSync(filePath, "utf-8");
  return NextResponse.json(JSON.parse(raw));
}

export async function PUT(req: Request) {
  const body = await req.json();
  writeFileSync(filePath, JSON.stringify(body, null, 2), "utf-8");
  return NextResponse.json({ ok: true });
}
