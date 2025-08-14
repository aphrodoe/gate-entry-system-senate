// src/scripts/seedEntries.ts
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const { connectDB } = require("../lib/mongodb");
const { Entry } = require("../models/Entry");

async function seed() {
  try {
    await connectDB();

    await Entry.deleteMany({});

   await Entry.insertMany([
  {
    rollNo: "B24CS1047",
    outsideCampus: false,
    location: "Main Gate",
    timestamp: new Date(),
  },
  {
    rollNo: "B24CS1027",
    outsideCampus: true,
    location: "Main Gate",
    timestamp: new Date(Date.now() - 1000 * 60 * 1), // 1 min ago
  },
  {
    rollNo: "B23EE1042",
    outsideCampus: false,
    location: "Side Gate",
    timestamp: new Date(Date.now() - 1000 * 60 * 3), // 3 min ago
  },
  {
    rollNo: "B22ME1088",
    outsideCampus: true,
    location: "Main Gate",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
  },
  {
    rollNo: "B24CM1009",
    outsideCampus: false,
    location: "Gate 2",
    timestamp: new Date(Date.now() - 1000 * 60 * 7), // 7 min ago
  },
  {
    rollNo: "B23CH1045",
    outsideCampus: true,
    location: "Main Gate",
    timestamp: new Date(Date.now() - 1000 * 60 * 9), // 9 min ago
  },
]);

    console.log("✅ Dummy entries inserted successfully");
  } catch (error) {
    console.error("❌ Error inserting dummy data:", error);
  } finally {
    process.exit();
  }
}

seed();