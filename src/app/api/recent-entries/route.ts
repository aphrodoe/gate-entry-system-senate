import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Entry } from "@/models/Entry";

export async function GET() {
  await connectDB();

  const entries = await Entry.find()
    .sort({ timestamp: -1 })
    .limit(15)
    .lean();

  return NextResponse.json(entries);
}