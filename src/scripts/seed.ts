import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { connectDB } from "../lib/mongodb";
import { Student } from "../models/Student";

async function seed() {
  try {
    await connectDB();

    await Student.deleteMany({});

    await Student.insertMany([
      {
        rollNo: "B24CS1005",
        name: "Akhil Dhyani",
        photoUrl: "https://drive.google.com/uc?export=view&id=1QFnBdZbb_nwK1GrpOTRuwhvH5LdnqLub",
        outsideCampus: false,
        lastToggledAt: new Date(),
        allowed: true,
      },
      {
        rollNo: "B24CS1027",
        name: "Divyansh Yadav",
        photoUrl: "https://drive.google.com/uc?export=view&id=1QFnBdZbb_nwK1GrpOTRuwhvH5LdnqLub",
        outsideCampus: false,
        lastToggledAt: new Date(),
        allowed: false,
      }
    ]);

    console.log("✅ Dummy students inserted successfully");
  } catch (error) {
    console.error("❌ Error inserting dummy data:", error);
  } finally {
    process.exit();
  }
}

seed();
