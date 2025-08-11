"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { BrowserMultiFormatReader } from "@zxing/browser";

const BarcodeScanner = dynamic(() => import("react-qr-barcode-scanner"), { ssr: false });

type StudentType = {
  rollNo: string;
  name: string;
  photoUrl: string;
  outsideCampus: boolean;
  lastToggledAt: string;
};

export default function Home() {
  const [data, setData] = useState("");
  const [student, setStudent] = useState<StudentType | null>(null);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fetchStudent = async (rollNo: string) => {
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNo }),
      });
      const result = await res.json();
      if (res.ok) {
        setStudent(result);
        setError("");
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to connect to server");
    }
  };

  const handleScan = async (scanData: { text: string } | null) => {
    if (scanData && scanData.text && scanData.text !== data) {
      setData(scanData.text);
      fetchStudent(scanData.text);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDecodeFile = async () => {
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = async () => {
      const img = new window.Image();
      img.src = reader.result as string;
      img.onload = async () => {
        try {
          const codeReader = new BrowserMultiFormatReader();
          const result = await codeReader.decodeFromImageElement(img);
          setData(result.getText());
          fetchStudent(result.getText());
        } catch {
          setError("Could not decode barcode from image");
        }
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <main style={{ padding: "20px" }}>
      <h1>Gate Entry System</h1>

      <div style={{ maxWidth: "400px" }}>
        <BarcodeScanner
          onUpdate={(_, result) => {
            if (result) handleScan({ text: result.getText() });
          }}
        />
      </div>

      <h3>Or Upload Barcode Image</h3>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleDecodeFile} disabled={!file}>
        Decode from Image
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {student && (
        <div style={{ marginTop: "20px" }}>
          <Image
            src={student.photoUrl}
            alt="Student"
            width={120}
            height={120}
            style={{ objectFit: "cover" }}
          />
          <p>Name: {student.name}</p>
          <p>Roll No: {student.rollNo}</p>
          <p>
            Status:{" "}
            <span style={{ color: student.outsideCampus ? "red" : "green" }}>
              {student.outsideCampus ? "Outside" : "Inside"}
            </span>
          </p>
          <p>Last Updated: {new Date(student.lastToggledAt).toLocaleString()}</p>
        </div>
      )}
    </main>
  );
}
