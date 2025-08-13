'use client'; 

import { useState, useRef } from 'react';
import Barcode from 'react-barcode';
import { toPng } from 'html-to-image';

export default function Home() {
  const [rollNo, setRollNo] = useState<string>('');
  const [signedData, setSignedData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const barcodeRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!rollNo) {
      setError('Please enter a roll number.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSignedData(null);

    try {
      console.log("[PAGE] Sending rollNo for generation:", rollNo);
      const response = await fetch('/api/generate-secure-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNo: rollNo.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate secure data');
      }

      const data: { signedData: string } = await response.json();
      console.log("[PAGE] Received signedData:", data.signedData);
      setSignedData(data.signedData);

    } catch (err: any) {
      console.error("[PAGE] Error generating barcode:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (!barcodeRef.current) return;

    toPng(barcodeRef.current, { cacheBust: true, backgroundColor: '#FFFFFF' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `barcode-${rollNo || 'generated'}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("[PAGE] Failed to convert barcode to image", err);
        setError("Could not download the barcode image.");
      });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-900 text-white font-sans">
      <div className="bg-gray-800 shadow-2xl rounded-xl p-8 w-full max-w-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Secure Barcode Generator</h1>
          <p className="text-gray-400 mb-6">Enter a roll number to generate a secure ID barcode.</p>

          <div className="flex gap-3">
            <input 
              type="text" 
              value={rollNo} 
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="e.g., B24CS1005" 
              className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-6 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-600 transition"
            >
              {isLoading ? "Generating..." : "Generate"}
            </button>
          </div>
          
          {error && <p className="mt-4 text-red-400 font-semibold">{error}</p>}
        </div>

        {signedData && (
          <div className="mt-8 text-center">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-300">Generated Barcode</h2>
              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
            
            <div ref={barcodeRef} className="bg-white p-4 rounded-lg flex justify-center overflow-x-auto">
              <Barcode 
                value={signedData}
                format="CODE128"
                lineColor="#000000"
                background="#FFFFFF"
                height={80}
                width={2}
                displayValue={false}
              />
            </div>
            <p className="mt-3 text-xs text-gray-500 break-all">{signedData}</p>
          </div>
        )}
      </div>
    </main>
  );
}
