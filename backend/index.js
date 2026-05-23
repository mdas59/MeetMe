if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");

const cookieParser = require("cookie-parser");
const cors = require("cors");

const { Server } = require("socket.io");
const { createServer } = require("node:http");
const { connectToSocket } = require("./controller/socket_controller.js");
const { User } = require("./models/users.js");
const { Meeting } = require("./models/meetings.js");
const authGuard = require("./middleware/auth.js");

const User_router = require("./routes/user_route.js");

main()
  .then((res) => console.log("connected to db"))
  .catch((err) => console.log("failed to connect"));

async function main() {
  await mongoose.connect(process.env.MONGO_DB_URL);
}

const app = express();
app.use(cookieParser());

// setting up the cors
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, //for JWT cookies to work
  }),
);

// to restrain payload
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// connecting the socket.io server with our node:http and express app
const server = createServer(app);
const io = connectToSocket(server);

app.use("/", User_router);

//  home route
app.get("/", (req, res) => {
  res.send("Welcome to the Zoom Clone Backend");
});

// dashboard
app.get("/dashboard", authGuard, async (req, res) => {
  const user = await User.findById(req.user._id).populate("meetings");
  res.json({
    message: `Welcome back, ${user.username}`,
    meetings: user.meetings,
  });
});

// guest
app.get("/join-meeting", (req, res) => {
  res.json({ message: "Redirecting to meeting room as Guest..." });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
