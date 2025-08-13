import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Student } from "@/models/Student";
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    let { signedData } = await request.json();
    console.log("[SCANNER] Raw signedData input:", signedData);

    if (!signedData || typeof signedData !== 'string' || !signedData.includes(':')) {
      return NextResponse.json({ error: "Invalid barcode data format" }, { status: 400 });
    }

    signedData = signedData.trim();
    let [rollNo, providedSignature] = signedData.split(':');

    const cleanRollNo = rollNo.trim().toUpperCase();
    const cleanProvidedSignature = providedSignature.trim();

    console.log("[SCANNER] Clean rollNo:", cleanRollNo);
    console.log("[SCANNER] Provided signature:", cleanProvidedSignature);

    const secret = process.env.BARCODE_SECRET;
    if (!secret) {
      console.error("[SCANNER] Missing BARCODE_SECRET");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    console.log("[SCANNER] About to generate signature for:", cleanRollNo);
    console.log("[SCANNER] Using secret (first 10 chars):", secret.substring(0, 10) + "...");
    
    const signatureBuffer = crypto
      .createHmac('sha256', secret)
      .update(cleanRollNo)
      .digest();

    console.log("[SCANNER] Full signature buffer (hex):", signatureBuffer.toString('hex'));
    
    const truncatedBuffer = signatureBuffer.subarray(0, 6);
    console.log("[SCANNER] Truncated buffer (hex):", truncatedBuffer.toString('hex'));
    
    const expectedSignature = truncatedBuffer.toString('base64url');
    console.log("[SCANNER] Expected signature:", expectedSignature);

    console.log("[SCANNER] Expected (base64):", truncatedBuffer.toString('base64'));
    console.log("[SCANNER] Provided signature length:", cleanProvidedSignature.length);
    console.log("[SCANNER] Expected signature length:", expectedSignature.length);

    if (expectedSignature.toLowerCase() !== cleanProvidedSignature.toLowerCase()) {
      console.error("[SCANNER] Signature mismatch! Data may be tampered.");
      console.error("[SCANNER] Expected:", expectedSignature);
      console.error("[SCANNER] Provided:", cleanProvidedSignature);
      return NextResponse.json({ error: "Invalid or Tampered Barcode" }, { status: 403 });
    }
    
    console.log("[SCANNER] Signature validated successfully!");
    if (expectedSignature !== cleanProvidedSignature) {
      console.warn("[SCANNER] Note: Signature case was modified during scanning, but content is valid");
    }

    await connectDB();
    const student = await Student.findOne({
      rollNo: { $regex: new RegExp(`^${cleanRollNo}$`, 'i') }
    });

    if (!student) {
      console.warn("[SCANNER] Student not found for rollNo:", cleanRollNo);
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    student.outsideCampus = !student.outsideCampus;
    student.lastToggledAt = new Date();
    await student.save();

    console.log("[SCANNER] Student updated:", student);

    return NextResponse.json({
      rollNo: student.rollNo,
      name: student.name,
      photoUrl: student.photoUrl,
      outsideCampus: student.outsideCampus,
      lastToggledAt: student.lastToggledAt,
    });

  } catch (error) {
    console.error("[SCANNER] Internal server error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}