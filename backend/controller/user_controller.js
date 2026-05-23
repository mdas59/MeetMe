if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { User } = require("../models/users.js");
const { Meeting } = require("../models/meetings.js");

// log in
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // backend validation
    if (!email || !password)
      return res.status(400).json({ message: "Please enter all the fields" });
    // find existing user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    // check password
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass)
      return res.status(401).json({ message: "Invalid password" });
    //  assign token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 60 * 60 * 1000,
      })
      .json({ message: "Logged in", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  signup
const signup = async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    // backend validation
    if (!username || !email || !phone || !password)
      return res.status(400).json({ message: "Please enter all the fields" });

    //  find existing user
    const user = await User.findOne({ email });
    if (user) return res.status(409).json({ message: "User already exists" });

    // use salt and hash for secure password
    const salt = await bcrypt.genSalt(16);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create and save new user
    const newUser = new User({
      username,
      email,
      phone,
      password: hashedPassword,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  log out
const logout = (req, res) => {
  res.clearCookie("token").json({ message: "Logged out successfully" });
};

const addMeetingHistory = async (req, res) => {
  try {
    // req.user._id comes from authGuard middleware
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { meetingId } = req.body;

    // create  meeting with the user's username
    const newMeeting = new Meeting({
      meetingId,
      username: user.username,
      user: req.user._id,
    });
    const savedMeeting = await newMeeting.save();

    // link the meeting to the User's embedded list
    user.meetings.push(savedMeeting._id);
    await user.save();
    res.status(201).json({ message: "Meeting created", meeting: savedMeeting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMeetingHistory = async (req, res) => {
  try {
    // find user from DB
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // find all meetings where the username
    const userMeetings = await Meeting.find({ user: req.user._id });

    res.status(200).json({
      username: user.username,
      totalMeetings: userMeetings.length,
      meetings: userMeetings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  login,
  signup,
  logout,
  getMeetingHistory,
  addMeetingHistory,
};
