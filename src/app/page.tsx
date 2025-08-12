"use client";

import { useState, useRef, useEffect } from "react";
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
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const fetchStudent = async (rollNo: string) => {
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNo }),
      });

      let result;
      try {
        result = await res.json();
      } catch {
        setError("Invalid server response");
        return;
      }

      if (res.ok) {
        setStudent(result);
        setError("");
      } else {
        setError(result.error || "Unknown error");
      }
    } catch {
      setError("Failed to connect to server");
    }
  };

  const startScanning = async () => {
    try {
      setError("");
      setIsScanning(true);

      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // Use navigator.mediaDevices.enumerateDevices() instead
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputDevices = devices.filter(device => device.kind === 'videoinput');

      if (videoInputDevices.length === 0) {
        setError("No camera found");
        setIsScanning(false);
        return;
      }

      // Prefer back camera if available
      const backCamera = videoInputDevices.find(d =>
        /back|rear|environment/i.test(d.label)
      );
      const selectedDeviceId = backCamera?.deviceId || videoInputDevices[0].deviceId;

      if (!videoRef.current) {
        setError("Video element not ready");
        setIsScanning(false);
        return;
      }

      codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, decodeError) => {
          if (result) {
            const scannedText = result.getText();
            setData(scannedText);
            fetchStudent(scannedText);
            stopScanning();
          }
          if (decodeError && decodeError.name !== "NotFoundException") {
            console.error(decodeError);
          }
        }
      );
    } catch (err) {
      console.error(err);
      setError("Failed to start camera");
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      try {
        // Stop all video streams
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
        
        // Reset the code reader
        codeReaderRef.current = null;
      } catch (error) {
        console.error('Error stopping camera:', error);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning(); // Cleanup on unmount
    };
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6 font-sans">
      <div className="bg-gray-800 shadow-2xl rounded-xl p-8 w-full max-w-lg">
        <h3 className="text-xl font-semibold mb-6">
          Scan Barcode with Camera
        </h3>

        {!isScanning ? (
          <button
            onClick={startScanning}
            className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium transition flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Start Camera Scan
          </button>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-lg object-cover"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-red-500 w-48 h-32 rounded-lg opacity-50"></div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-400">
              Position barcode within the red frame
            </p>
            <button
              onClick={stopScanning}
              className="w-full py-3 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-lg font-medium transition"
            >
              Stop Scanning
            </button>
          </div>
        )}

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