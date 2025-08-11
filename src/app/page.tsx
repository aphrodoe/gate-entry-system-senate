"use client";

import { useState } from "react";
import Image from "next/image";
import { BrowserMultiFormatReader } from "@zxing/browser";

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
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6 font-sans">
      

      <div className="bg-gray-800 shadow-2xl rounded-xl p-8 w-full max-w-lg">
        <h3 className="text-xl font-semibold mb-6">
          Upload Barcode Image
        </h3>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-300 border border-gray-600 rounded-lg cursor-pointer bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 mb-5"
        />

        <button
          onClick={handleDecodeFile}
          disabled={!file}
          className={`w-full py-3 px-4 rounded-lg text-white text-lg font-medium transition ${
            file
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-600 cursor-not-allowed"
          }`}
        >
          Scan
        </button>

        {error && (
          <p className="text-red-400 font-semibold mt-4">{error}</p>
        )}

        {student && (
          <div className="mt-8 text-center">
            <div className="flex justify-center">
              <Image
                src={student.photoUrl}
                alt="Student"
                width={180}
                height={180}
                className="rounded-2xl object-cover shadow-lg border-4 border-gray-700"
              />
            </div>
            <p className="mt-5 text-2xl font-bold">{student.name}</p>
            <p className="text-gray-400 text-lg">Roll No: {student.rollNo}</p>
            <p className="mt-3 text-xl">
              Status:{" "}
              <span
                className={`font-bold ${
                  student.outsideCampus ? "text-red-400" : "text-green-400"
                }`}
              >
                {student.outsideCampus ? "Outside" : "Inside"}
              </span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last Updated: {new Date(student.lastToggledAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
