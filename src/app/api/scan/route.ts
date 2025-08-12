import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Student } from "@/models/Student";

export async function POST(request: Request) {
  try {
    const { rollNo } = await request.json();

    if (!rollNo || typeof rollNo !== 'string') {
      return NextResponse.json({ error: "Valid roll number is required" }, { status: 400 });
    }

    await connectDB();

    // Trim whitespace and use case-insensitive search
    const trimmedRollNo = rollNo.trim();
    const student = await Student.findOne({ 
      rollNo: { $regex: new RegExp(`^${trimmedRollNo}$`, 'i') }
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Toggle the outsideCampus status
    student.outsideCampus = !student.outsideCampus;
    student.lastToggledAt = new Date();
    await student.save();

    return NextResponse.json({
      rollNo: student.rollNo, // Return the actual case from database
      name: student.name,
      photoUrl: student.photoUrl,
      outsideCampus: student.outsideCampus,
      lastToggledAt: student.lastToggledAt,
    });
  } catch (error) {
    console.error("Error processing scan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
