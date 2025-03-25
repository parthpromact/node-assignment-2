import jwt from "jsonwebtoken";
// Token Middlware
export const tokenChecker = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];

  // If Token is not Provided
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No Token Provided" });
  }
    // Descode Token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Check Token is not Expired
    if (decodedToken.exp < Date.now() / 1000) {
      return res.status(401).json({ message: "Unauthorized: Token Expired" });
    }

    //
    req.user = decodedToken.userData;
    next();
};
