"use client";

import { useEffect, useState } from "react";

export default function DashboardPage(){
   const [entries, setEntries] = useState<any[]>([]);

   const fetchEntries = async () => {
    try{
       const res = await fetch("/api/recent-entries");
       const data = await res.json();
       setEntries(data);
    } catch (error) {
      console.error("Error fetching entries:", error);
    }
   }

   useEffect(()=>{
    fetchEntries();
    const interval = setInterval(fetchEntries, 5000);
    return () => clearInterval(interval);
   }, []);

   return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "20px" }}>
        📋 Recent Gate Entries (Live)
      </h1>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#1e293b",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <thead style={{ background: "#334155" }}>
          <tr>
            <th style={thStyle}>Roll No</th>
            <th style={thStyle}>Outside Campus</th>
            <th style={thStyle}>Location</th>
            <th style={thStyle}>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr
              key={index}
              style={{
                borderBottom: "1px solid #475569",
                textAlign: "center",
              }}
            >
              <td style={tdStyle}>{entry.rollNo}</td>
              <td style={tdStyle}>
                {entry.outsideCampus ? "✅ Yes" : "❌ No"}
              </td>
              <td style={tdStyle}>{entry.location}</td>
              <td style={tdStyle}>
                {new Date(entry.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


const thStyle = {
  padding: "12px",
  fontWeight: "bold",
  color: "#f1f5f9",
};

const tdStyle = {
  padding: "10px",
  color: "#e2e8f0",
};

