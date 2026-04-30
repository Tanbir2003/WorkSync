import { auth, db } from "../firebase-admin.js";

/**
 * Middleware: Verify Firebase ID token from Authorization header.
 * Attaches `req.user` with { uid, email, role, name }.
 */
export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.split("Bearer ")[1];

  try {
    const decoded = await auth.verifyIdToken(token);
    // Fetch user doc from Firestore for role info
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    if (!userDoc.exists) {
      return res.status(403).json({ error: "User profile not found. Please register first." });
    }
    req.user = { uid: decoded.uid, ...userDoc.data() };
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Middleware: Require ADMIN role.
 * Must be used AFTER authenticate().
 */
export function requireAdmin(req, res, next) {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
