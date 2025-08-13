import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudent extends Document {
  rollNo: string;
  name: string;
  photoUrl: string;
  outsideCampus: boolean;
  lastToggledAt: Date;
  allowed: boolean;
}

const studentSchema = new Schema<IStudent>({
  rollNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  photoUrl: { type: String, required: true },
  outsideCampus: { type: Boolean, default: false },
  lastToggledAt: { type: Date, default: Date.now },
  allowed: { type: Boolean, default: true },
});

export const Student: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", studentSchema);
