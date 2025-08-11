"use client";

import { useRef, useEffect, useState } from "react";
import JsBarcode from "jsbarcode";

export default function GeneratePage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rollNo, setRollNo] = useState("101");

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, rollNo, { format: "CODE128" });
    }
  }, [rollNo]);

  return (
    <main style={{ padding: "20px" }}>
      <h1>Generate Barcode</h1>
      <input value={rollNo} onChange={(e) => setRollNo(e.target.value)} />
      <svg ref={svgRef}></svg>
    </main>
  );
}
