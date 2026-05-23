const jwt = require("jsonwebtoken");

const authGuard = (req, res, next) => {
  // check req header
  const authHeader = req.headers.authorization || req.headers["authorization"];
  // find token from header
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  const token = req.cookies.token || bearerToken;
  //  verfiy authentcation
  if (!token) {
    return res.status(401).json({ message: "Access Denied. Please log in." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid Token" });
  }
};

module.exports = authGuard;
