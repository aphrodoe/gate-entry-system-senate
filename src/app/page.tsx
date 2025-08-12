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
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          facingMode: 'environment', // Prefer back camera
          focusMode: 'continuous',
          exposureMode: 'continuous',
          whiteBalanceMode: 'continuous'
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

    // Use higher resolution for better barcode detection
    const scale = 2; // Increase resolution
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;

    // Improve image quality
    context.imageSmoothingEnabled = false;
    context.scale(scale, scale);
    
    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    // Convert to PNG for better quality (less compression)
    const imageDataUrl = canvas.toDataURL('image/png');
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
          let result = null;
          let scannedText = "";

          console.log('Image loaded, dimensions:', img.width, 'x', img.height);

          // Strategy 1: Direct decode
          try {
            result = await codeReader.decodeFromImageElement(img);
            scannedText = result.getText();
            console.log('Barcode detected (direct):', scannedText);
          } catch (directError) {
            console.log('Direct decode failed:', (directError instanceof Error ? directError.message : String(directError)));
            
            // Strategy 2: Try multiple canvas preprocessing techniques
            const strategies = [
              { name: 'Enhanced Contrast', filter: 'contrast(200%) brightness(120%)' },
              { name: 'High Contrast B&W', filter: 'contrast(300%) brightness(100%) grayscale(100%)' },
              { name: 'Inverted', filter: 'invert(1) contrast(150%)' },
              { name: 'Sharpened', filter: 'contrast(150%) brightness(110%) saturate(0%) blur(0px)' }
            ];

            for (const strategy of strategies) {
              try {
                console.log(`Trying ${strategy.name}...`);
                
                const tempCanvas = document.createElement('canvas');
                const tempContext = tempCanvas.getContext('2d');
                
                if (tempContext) {
                  // Use original image dimensions
                  tempCanvas.width = img.width;
                  tempCanvas.height = img.height;
                  
                  // Apply filter and draw
                  tempContext.filter = strategy.filter;
                  tempContext.drawImage(img, 0, 0);
                  
                  // Try to decode
                  result = await codeReader.decodeFromCanvas(tempCanvas);
                  scannedText = result.getText();
                  console.log(`Barcode detected with ${strategy.name}:`, scannedText);
                  break; // Success, exit loop
                }
              } catch (strategyError) {
                console.log(
                  `${strategy.name} failed:`,
                  strategyError instanceof Error ? strategyError.message : String(strategyError)
                );
                continue; // Try next strategy
              }
            }

            // If all strategies failed, try cropping the center area
            if (!scannedText) {
              try {
                console.log('Trying center crop...');
                const tempCanvas = document.createElement('canvas');
                const tempContext = tempCanvas.getContext('2d');
                
                if (tempContext) {
                  // Crop center 80% of the image
                  const cropSize = 0.8;
                  const cropX = img.width * (1 - cropSize) / 2;
                  const cropY = img.height * (1 - cropSize) / 2;
                  const cropWidth = img.width * cropSize;
                  const cropHeight = img.height * cropSize;
                  
                  tempCanvas.width = cropWidth;
                  tempCanvas.height = cropHeight;
                  
                  tempContext.filter = 'contrast(200%) brightness(120%)';
                  tempContext.drawImage(
                    img, 
                    cropX, cropY, cropWidth, cropHeight,  // Source crop
                    0, 0, cropWidth, cropHeight           // Destination
                  );
                  
                  result = await codeReader.decodeFromCanvas(tempCanvas);
                  scannedText = result.getText();
                  console.log('Barcode detected (cropped):', scannedText);
                }
              } catch (cropError) {
                console.log(
                  'Crop strategy failed:',
                  cropError instanceof Error ? cropError.message : String(cropError)
                );
              }
            }
          }

          if (scannedText) {
            setData(scannedText);
            await fetchStudent(scannedText);
          } else {
            // Just set a message instead of throwing error
            setError("No barcode detected in the image. Please try retaking the photo or enter the roll number manually.");
          }
        } catch (decodeError) {
          console.error('Decode error:', decodeError);
          setError("No barcode detected in the image. Please try retaking the photo or enter the roll number manually.");
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
            <div className="text-xs text-gray-500 text-center">
              Tips: Ensure barcode is clear, well-lit, and fills a good portion of the frame
            </div>
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
          <div className="mt-4">
            <p className="text-red-400 font-semibold whitespace-pre-line">{error}</p>
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-400">Can't scan? Enter manually:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter roll number"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={() => data && fetchStudent(data)}
                  disabled={!data.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
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