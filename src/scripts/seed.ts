import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { connectDB } from "../lib/mongodb";
import { Student } from "../models/Student";

async function seed() {
  try {
    await connectDB();

    // Clear old data
    await Student.deleteMany({});

    // Insert dummy data
    await Student.insertMany([
      {
        rollNo: "101",
        name: "Alice Johnson",
        photoUrl: "https://randomuser.me/api/portraits/women/1.jpg",
        outsideCampus: false,
        lastToggledAt: new Date(),
      },
      {
        rollNo: "102",
        name: "Bob Smith",
        photoUrl: "https://randomuser.me/api/portraits/men/2.jpg",
        outsideCampus: false,
        lastToggledAt: new Date(),
      },
      {
        rollNo: "103",
        name: "Charlie Lee",
        photoUrl: "https://randomuser.me/api/portraits/men/3.jpg",
        outsideCampus: false,
        lastToggledAt: new Date(),
      },
    ]);

    console.log("✅ Dummy students inserted successfully");
  } catch (error) {
    console.error("❌ Error inserting dummy data:", error);
  } finally {
    process.exit();
  }
}

seed();
