import { Router } from "express";
import { db } from "../firebase-admin.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/tasks
 * Admin: get all tasks.
 * Member: get only tasks assigned to them.
 * Query params: ?status=TODO&projectId=xxx
 */
router.get("/", authenticate, async (req, res) => {
  try {
    let query = db.collection("tasks");

    // Filter by project if provided
    if (req.query.projectId) {
      query = query.where("projectId", "==", req.query.projectId);
    }

    // Filter by status if provided
    if (req.query.status) {
      query = query.where("status", "==", req.query.status);
    }

    // Members only see their own tasks
    if (req.user.role !== "ADMIN") {
      query = query.where("assigneeId", "==", req.user.uid);
    }

    const snapshot = await query.get();

    const tasks = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort descending in memory
    res.json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

/**
 * POST /api/projects/:projectId/tasks
 * Create a task within a project. Admin only.
 * Body: { title, description, dueDate, assigneeId? }
 */
router.post(
  "/projects/:projectId/tasks",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { title, description, dueDate, assigneeId } = req.body;
      const { projectId } = req.params;

      if (!title) {
        return res.status(400).json({ error: "Task title is required" });
      }

      // Verify project exists
      const projectDoc = await db.collection("projects").doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Verify assignee exists if provided
      if (assigneeId) {
        const assigneeDoc = await db.collection("users").doc(assigneeId).get();
        if (!assigneeDoc.exists) {
          return res.status(404).json({ error: "Assignee not found" });
        }
      }

      const taskData = {
        title,
        description: description || "",
        status: "TODO",
        dueDate: dueDate || null,
        projectId,
        projectName: projectDoc.data().name,
        assigneeId: assigneeId || null,
        createdAt: new Date().toISOString(),
        createdBy: req.user.uid,
      };

      const docRef = await db.collection("tasks").add(taskData);

      res.status(201).json({ id: docRef.id, ...taskData });
    } catch (err) {
      console.error("Create task error:", err);
      res.status(500).json({ error: "Failed to create task" });
    }
  }
);

/**
 * PUT /api/tasks/:taskId
 * Update a task.
 * Admin: can update anything.
 * Member: can only update status of tasks assigned to them.
 */
router.put("/:taskId", authenticate, async (req, res) => {
  try {
    const taskDoc = await db.collection("tasks").doc(req.params.taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = taskDoc.data();

    // If Member, only allow status update on their own tasks
    if (req.user.role !== "ADMIN") {
      if (task.assigneeId !== req.user.uid) {
        return res
          .status(403)
          .json({ error: "You can only update tasks assigned to you" });
      }
      // Members can only change status
      const { status } = req.body;
      if (!status || !["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      await db
        .collection("tasks")
        .doc(req.params.taskId)
        .update({ status, updatedAt: new Date().toISOString() });

      return res.json({ id: req.params.taskId, ...task, status });
    }

    // Admin can update any field
    const updates = {};
    const allowed = ["title", "description", "status", "dueDate", "assigneeId"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (updates.status && !["TODO", "IN_PROGRESS", "DONE"].includes(updates.status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    updates.updatedAt = new Date().toISOString();

    await db.collection("tasks").doc(req.params.taskId).update(updates);

    res.json({ id: req.params.taskId, ...task, ...updates });
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

/**
 * DELETE /api/tasks/:taskId
 * Delete a task. Admin only.
 */
router.delete("/:taskId", authenticate, requireAdmin, async (req, res) => {
  try {
    const taskDoc = await db.collection("tasks").doc(req.params.taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found" });
    }

    await db.collection("tasks").doc(req.params.taskId).delete();
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
