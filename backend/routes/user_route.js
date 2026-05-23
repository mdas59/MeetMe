const { Router } = require("express");
const {
  login,
  signup,
  logout,
  getMeetingHistory,
  addMeetingHistory,
} = require("../controller/user_controller.js");
const authGuard = require("../middleware/auth.js");

const User_router = Router();

User_router.route("/login").post(login);
User_router.route("/signup").post(signup);
User_router.route("/logout").post(logout);
User_router.route("/add_to_activity").post(authGuard, addMeetingHistory);
User_router.route("/get_all_activity").get(authGuard, getMeetingHistory);

module.exports = User_router;
