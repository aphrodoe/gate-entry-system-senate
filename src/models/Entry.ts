import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEntry extends Document {
  rollNo: string;
  outsideCampus: boolean;
  timestamp: Date;
  location: string;
}

const entrySchema = new Schema<IEntry>({
  rollNo: { type: String, required: true },
  outsideCampus: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now, unique: true },
  location: { type: String, required: true },
});

export const Entry: Model<IEntry> =
  mongoose.models.Entry || mongoose.model<IEntry>("Entry", entrySchema);