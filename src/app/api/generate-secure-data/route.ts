import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  const { rollNo } = await request.json();
  if (!rollNo) {
    return NextResponse.json({ error: 'Roll number is required' }, { status: 400 });
  }

  const cleanRollNo = rollNo.trim().toUpperCase();
  console.log("[GENERATOR] Received rollNo:", rollNo);
  console.log("[GENERATOR] Clean rollNo:", cleanRollNo);

  const secret = process.env.BARCODE_SECRET;
  if (!secret) {
    console.error("[GENERATOR] Missing BARCODE_SECRET");
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  console.log("[GENERATOR] About to generate signature for:", cleanRollNo);
  console.log("[GENERATOR] Using secret (first 10 chars):", secret.substring(0, 10) + "...");

  const signatureBuffer = crypto
    .createHmac('sha256', secret)
    .update(cleanRollNo)
    .digest();

  console.log("[GENERATOR] Full signature buffer (hex):", signatureBuffer.toString('hex'));

  const truncatedBuffer = signatureBuffer.subarray(0, 6);
  console.log("[GENERATOR] Truncated buffer (hex):", truncatedBuffer.toString('hex'));
  
  const signature = truncatedBuffer.toString('base64url');
  console.log("[GENERATOR] Generated signature:", signature);
  console.log("[GENERATOR] Generated signature length:", signature.length);

  const signedData = `${cleanRollNo}:${signature}`;
  console.log("[GENERATOR] Final signedData:", signedData);

  return NextResponse.json({ signedData });
}