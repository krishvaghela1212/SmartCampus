import mongoose from "mongoose";

const broadcastSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    message: {
      type: String,
      required: true
    },
    department: {
      type: String,
      default: "ALL"
    },
    targetSemester: {
      type: String,
      default: "ALL"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Broadcast", broadcastSchema);
