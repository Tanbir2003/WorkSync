import { Router } from "express";
import { db } from "../firebase-admin.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/dashboard
 * Returns summary statistics for the logged-in user.
 * Admin: sees all tasks.
 * Member: sees only their assigned tasks.
 */
router.get("/", authenticate, async (req, res) => {
  try {
    let query = db.collection("tasks");

    // Members only see their own tasks
    if (req.user.role !== "ADMIN") {
      query = query.where("assigneeId", "==", req.user.uid);
    }

    const snapshot = await query.get();
    const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const now = new Date();

    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === "TODO").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const done = tasks.filter((t) => t.status === "DONE").length;
    const overdue = tasks.filter((t) => {
      if (!t.dueDate || t.status === "DONE") return false;
      return new Date(t.dueDate) < now;
    }).length;

    // Get recent tasks (last 5)
    const recentTasks = tasks
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Get overdue tasks list
    const overdueTasks = tasks
      .filter((t) => {
        if (!t.dueDate || t.status === "DONE") return false;
        return new Date(t.dueDate) < now;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    // Project count
    const projectsSnapshot = await db.collection("projects").get();
    const projectCount = projectsSnapshot.size;

    // Team size
    const usersSnapshot = await db.collection("users").get();
    const teamSize = usersSnapshot.size;

    res.json({
      stats: { total, todo, inProgress, done, overdue, projectCount, teamSize },
      recentTasks,
      overdueTasks,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

export default router;
