import { Router } from "express";
import { db } from "../firebase-admin.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/projects
 * List all projects.
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const snapshot = await db
      .collection("projects")
      .orderBy("createdAt", "desc")
      .get();

    const projects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(projects);
  } catch (err) {
    console.error("Get projects error:", err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

/**
 * POST /api/projects
 * Create a new project. Admin only.
 * Body: { name, description }
 */
router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const projectData = {
      name,
      description: description || "",
      createdAt: new Date().toISOString(),
      createdBy: req.user.uid,
    };

    const docRef = await db.collection("projects").add(projectData);

    res.status(201).json({ id: docRef.id, ...projectData });
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

/**
 * GET /api/projects/:id
 * Get project details including its tasks.
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const projectDoc = await db.collection("projects").doc(req.params.id).get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Fetch tasks for this project
    const tasksSnapshot = await db
      .collection("tasks")
      .where("projectId", "==", req.params.id)
      .get();

    const tasks = tasksSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort descending in memory

    res.json({
      id: projectDoc.id,
      ...projectDoc.data(),
      tasks,
    });
  } catch (err) {
    console.error("Get project error:", err);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project and all its tasks. Admin only.
 */
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const projectDoc = await db.collection("projects").doc(req.params.id).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Delete all tasks belonging to this project
    const tasksSnapshot = await db
      .collection("tasks")
      .where("projectId", "==", req.params.id)
      .get();

    const batch = db.batch();
    tasksSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(projectDoc.ref);
    await batch.commit();

    res.json({ message: "Project and its tasks deleted" });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
