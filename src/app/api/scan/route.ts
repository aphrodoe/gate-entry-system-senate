import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Student } from "@/models/Student";

export async function POST(req: Request) {
  try {
    const { rollNo } = await req.json();
    if (!rollNo) return NextResponse.json({ error: "rollNo is required" }, { status: 400 });

    await connectDB();

    let student = await Student.findOne({ rollNo });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    student.outsideCampus = !student.outsideCampus;
    student.lastToggledAt = new Date();
    await student.save();

    return NextResponse.json(student);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
