"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { set } from "mongoose";

type StudentType = {
  rollNo: string;
  name: string;
  photoUrl: string;
  outsideCampus: boolean;
  lastToggledAt: string;
};

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [student, setStudent] = useState<StudentType | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const fetchStudent = async (signedData: string) => {
    setIsLoading(true);
    setError("");
    setStudent(null);

    try {
      console.log("[PAGE] Sending signedData for scan:", signedData);
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedData }),
      });

      const result = await res.json();
      console.log("[PAGE] Scan API response:", result);

      if (res.ok) {
        setStudent(result);
      } else {
        setError(result.error || "An unknown error occurred");
      }
    } catch (err) {
      console.error("[PAGE] Error scanning:", err);
      setError("Failed to connect to the server");
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      fetchStudent(inputValue.trim());
      setInputValue("");
    }
  };

  const resetState = () => {
    setStudent(null);
    setError("");
    setInputValue("");
    inputRef.current?.focus();
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans">
      <div className="bg-gray-800 shadow-2xl rounded-xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Gate Scanner</h1>
        
        <div className="relative mb-4">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ready to Scan..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:ring-blue-500 focus:outline-none text-center text-lg transition"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
        </div>

        {isLoading && <p className="text-center text-blue-400">Processing...</p>}
        {error && <p className="text-center text-red-400 font-semibold">{error}</p>}
        
        {student && (
          <div className="mt-4 text-center border-t border-gray-700 pt-4 animate-fade-in">
            <div className="flex justify-center relative">
              <Image
                src={student.photoUrl}
                alt="Student"
                width={150}
                height={150}
                className="rounded-full object-cover shadow-lg border-4 border-gray-600"
              />
              <button onClick={resetState} className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 rounded-full p-2 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mt-4 text-3xl font-bold">{student.name}</p>
            <p className="text-gray-400 text-lg">Roll No: {student.rollNo}</p>
            <p className="mt-2 text-2xl font-semibold">
              <span className={student.outsideCampus ? "text-red-400" : "text-green-400"}>
                {student.outsideCampus ? "✅ Exited Campus" : "✅ Entered Campus"}
              </span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Time: {new Date(student.lastToggledAt).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
