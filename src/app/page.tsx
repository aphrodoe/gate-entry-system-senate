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
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const startCamera = async () => {
    try {
      setError("");
      setIsScanning(true);
      setCapturedImage(null);

      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Prefer back camera
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError("Failed to start camera");
      setIsScanning(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 image
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);

    // Stop the camera
    stopCamera();
  };

  const processImage = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    setError("");

    try {
      const codeReader = new BrowserMultiFormatReader();
      
      // Create an image element from the captured data
      const img = new window.Image();
      img.onload = async () => {
        try {
          const result = await codeReader.decodeFromImageElement(img);
          const scannedText = result.getText();
          console.log('Barcode detected:', scannedText);
          setData(scannedText);
          await fetchStudent(scannedText);
        } catch (decodeError) {
          console.error('Decode error:', decodeError);
          setError("No barcode found in the image. Please try again.");
        } finally {
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        setError("Failed to process image");
        setIsProcessing(false);
      };
      img.src = capturedImage;
    } catch (err) {
      console.error('Processing error:', err);
      setError("Failed to process image");
      setIsProcessing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setStudent(null);
    setData("");
    setError("");
  };

  useEffect(() => {
    return () => {
      stopCamera(); // Cleanup on unmount
    };
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6 font-sans">
      <div className="bg-gray-800 shadow-2xl rounded-xl p-8 w-full max-w-lg">
        <h3 className="text-xl font-semibold mb-6">
          Scan Barcode with Camera
        </h3>

        {!isScanning && !capturedImage ? (
          <button
            onClick={startCamera}
            className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium transition flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Start Camera
          </button>
        ) : isScanning ? (
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
              Position barcode within the red frame and click capture
            </p>
            <div className="flex gap-3">
              <button
                onClick={capturePhoto}
                className="flex-1 py-3 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white text-lg font-medium transition"
              >
                📸 Capture Photo
              </button>
              <button
                onClick={stopCamera}
                className="flex-1 py-3 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={capturedImage!}
                alt="Captured barcode"
                className="w-full h-64 bg-black rounded-lg object-cover"
              />
            </div>
            <p className="text-center text-sm text-gray-400">
              Photo captured! Click "Scan Barcode" to process.
            </p>
            <div className="flex gap-3">
              <button
                onClick={processImage}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-lg font-medium transition"
              >
                {isProcessing ? "🔄 Scanning..." : "🔍 Scan Barcode"}
              </button>
              <button
                onClick={resetCapture}
                className="flex-1 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium transition"
              >
                📷 Retake
              </button>
            </div>
          </div>
        )}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

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