import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getTasks, updateTask } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Tasks() {
  const { token, isAdmin, userProfile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const navigate = useNavigate();

  async function loadTasks() {
    if (!token) return;
    try {
      const data = await getTasks(token);
      setTasks(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  useEffect(() => { loadTasks(); }, [token]);

  async function handleStatusChange(taskId, status) {
    try {
      await updateTask(taskId, { status }, token);
      loadTasks();
    } catch (err) { alert(err.message); }
  }

  function isOverdue(task) {
    if (!task.dueDate || task.status === "DONE") return false;
    return new Date(task.dueDate) < new Date();
  }

  const filtered = filter === "ALL" ? tasks : tasks.filter((t) => t.status === filter);

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{isAdmin ? "All Tasks" : "My Tasks"}</h2>
          <p>{tasks.length} task{tasks.length !== 1 ? "s" : ""} total</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["ALL", "TODO", "IN_PROGRESS", "DONE"].map((s) => (
            <button key={s} className={`btn btn-sm ${filter === s ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilter(s)}>
              {s === "ALL" ? "All" : s === "TODO" ? "To Do" : s === "IN_PROGRESS" ? "In Progress" : "Done"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No tasks found</h3>
          <p>{filter !== "ALL" ? "Try changing the filter" : "Tasks assigned to you will appear here"}</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{t.title}</div>
                      {t.description && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{t.description.substring(0, 60)}{t.description.length > 60 ? "..." : ""}</div>}
                    </td>
                    <td>
                      <span style={{ cursor: "pointer", color: "var(--accent)" }} onClick={() => navigate(`/projects/${t.projectId}`)}>
                        {t.projectName || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${t.status.toLowerCase().replace("_", "-")}`}>
                        {t.status === "TODO" ? "To Do" : t.status === "IN_PROGRESS" ? "In Progress" : "Done"}
                      </span>
                    </td>
                    <td>
                      {t.dueDate ? (
                        <span className={isOverdue(t) ? "task-due overdue" : "task-due"}>
                          {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      {(isAdmin || t.assigneeId === userProfile?.uid) && (
                        <select className="form-select" style={{ width: "auto", padding: "6px 32px 6px 10px", fontSize: 12 }} value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)}>
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
