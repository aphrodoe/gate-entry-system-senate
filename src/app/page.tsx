"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const BarcodeScanner = dynamic(() => import("react-qr-barcode-scanner"), { ssr: false });

export default function Home() {
  const [data, setData] = useState("");
  const [student, setStudent] = useState<any>(null);
  const [error, setError] = useState("");

  const handleScan = async (scanData: { text: string } | null) => {
    if (scanData && scanData.text && scanData.text !== data) {
      setData(scanData.text);
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rollNo: scanData.text })
        });
        const result = await res.json();
        if (res.ok) {
          setStudent(result);
          setError("");
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError("Failed to connect to server");
      }
    }
  };

  return (
    <main style={{ padding: "20px" }}>
      <h1>Gate Entry System</h1>
      <div style={{ maxWidth: "400px" }}>
        <BarcodeScanner
          onUpdate={(err, result) => {
            if (result) handleScan({ text: result.getText() });
          }}
        />
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {student && (
        <div style={{ marginTop: "20px" }}>
          <img src={student.photoUrl} alt="Student" width={120} />
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
