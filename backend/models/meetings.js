const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema(
  {
    // which user started this meeting
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    meetingId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Meeting = mongoose.model("Meeting", MeetingSchema);

module.exports = { Meeting };
