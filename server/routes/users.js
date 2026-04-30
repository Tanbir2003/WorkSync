import { Router } from "express";
import { db } from "../firebase-admin.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

/**
 * POST /api/users
 * Create/sync a user profile in Firestore after Firebase Auth signup.
 * Body: { uid, name, email, role? }
 * The first user to register becomes ADMIN automatically.
 */
router.post("/", async (req, res) => {
  try {
    const { uid, name, email } = req.body;

    if (!uid || !name || !email) {
      return res.status(400).json({ error: "uid, name, and email are required" });
    }

    // Check if user already exists
    const existingUser = await db.collection("users").doc(uid).get();
    if (existingUser.exists) {
      return res.status(200).json({ message: "User already exists", user: existingUser.data() });
    }

    // Check if this is the first user — make them ADMIN
    const usersSnapshot = await db.collection("users").limit(1).get();
    const role = usersSnapshot.empty ? "ADMIN" : "MEMBER";

    const userData = {
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
    };

    await db.collection("users").doc(uid).set(userData);

    res.status(201).json({ message: "User created", user: { uid, ...userData } });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

/**
 * GET /api/users
 * Get all users (for task assignment dropdowns).
 * Requires authentication.
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
    res.json(users);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
