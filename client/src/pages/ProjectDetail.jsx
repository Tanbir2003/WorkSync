import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProject, createTask, updateTask, deleteTask, getUsers } from "../services/api";

export default function ProjectDetail() {
  const { id } = useParams();
  const { token, isAdmin, userProfile } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", assigneeId: "" });
  const [saving, setSaving] = useState(false);

  async function loadProject() {
    if (!token) return;
    try {
      const [proj, userList] = await Promise.all([getProject(id, token), getUsers(token)]);
      setProject(proj);
      setUsers(userList);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  useEffect(() => { loadProject(); }, [token, id]);

  function openCreate() {
    setEditTask(null);
    setForm({ title: "", description: "", dueDate: "", assigneeId: "" });
    setShowModal(true);
  }

  function openEdit(task) {
    setEditTask(task);
    setForm({ title: task.title, description: task.description || "", dueDate: task.dueDate ? task.dueDate.split("T")[0] : "", assigneeId: task.assigneeId || "" });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, dueDate: form.dueDate || null, assigneeId: form.assigneeId || null };
      if (editTask) {
        await updateTask(editTask.id, payload, token);
      } else {
        await createTask(id, payload, token);
      }
      setShowModal(false);
      loadProject();
    } catch (err) { alert(err.message); }
    setSaving(false);
  }

  async function handleStatusChange(taskId, status) {
    try {
      await updateTask(taskId, { status }, token);
      loadProject();
    } catch (err) { alert(err.message); }
  }

  async function handleDeleteTask(taskId) {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(taskId, token);
      loadProject();
    } catch (err) { alert(err.message); }
  }

  function getAssigneeName(uid) {
    if (!uid) return "Unassigned";
    const user = users.find((u) => u.uid === uid);
    return user ? user.name : "Unknown";
  }

  function isOverdue(task) {
    if (!task.dueDate || task.status === "DONE") return false;
    return new Date(task.dueDate) < new Date();
  }

  if (loading) return <div className="loading-spinner"></div>;
  if (!project) return <div className="empty-state"><h3>Project not found</h3></div>;

  const statusGroups = {
    TODO: project.tasks?.filter((t) => t.status === "TODO") || [],
    IN_PROGRESS: project.tasks?.filter((t) => t.status === "IN_PROGRESS") || [],
    DONE: project.tasks?.filter((t) => t.status === "DONE") || [],
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate("/projects")} style={{ marginBottom: 12 }}>
            ← Back to Projects
          </button>
          <h2>{project.name}</h2>
          <p>{project.description || "No description"}</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}>+ New Task</button>}
      </div>

      {!project.tasks?.length ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No tasks yet</h3>
          <p>{isAdmin ? "Create your first task for this project" : "No tasks have been created yet"}</p>
          {isAdmin && <button className="btn btn-primary" onClick={openCreate}>Create Task</button>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {Object.entries(statusGroups).map(([status, tasks]) => (
            tasks.length > 0 && (
              <div key={status}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <span className={`badge badge-${status.toLowerCase().replace("_", "-")}`}>
                    {status === "TODO" ? "To Do" : status === "IN_PROGRESS" ? "In Progress" : "Done"}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="task-list">
                  {tasks.map((t) => (
                    <div key={t.id} className="task-item">
                      <div style={{ flex: 1 }}>
                        <div className="task-title">{t.title}</div>
                        {t.description && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{t.description}</div>}
                        <div className="task-meta" style={{ marginTop: 8 }}>
                          <span>👤 {getAssigneeName(t.assigneeId)}</span>
                          {t.dueDate && <span className={`task-due ${isOverdue(t) ? "overdue" : ""}`}>📅 {new Date(t.dueDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {(isAdmin || t.assigneeId === userProfile?.uid) && (
                          <select className="form-select" style={{ width: "auto", padding: "6px 32px 6px 10px", fontSize: 12 }} value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)}>
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                          </select>
                        )}
                        {isAdmin && (
                          <>
                            <button className="btn-icon" onClick={() => openEdit(t)} title="Edit">✏️</button>
                            <button className="btn-icon" onClick={() => handleDeleteTask(t.id)} title="Delete">🗑️</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editTask ? "Edit Task" : "New Task"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input id="task-title" className="form-input" placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea id="task-desc" className="form-textarea" placeholder="Describe the task..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input id="task-due" type="date" className="form-input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select id="task-assignee" className="form-select" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {users.map((u) => <option key={u.uid} value={u.uid}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : editTask ? "Update Task" : "Create Task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
