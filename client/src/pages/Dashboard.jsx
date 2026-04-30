import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getDashboard } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { token, userProfile, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    getDashboard(token)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="loading-spinner"></div>;

  const s = data?.stats || {};

  function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function getStatusBadge(status) {
    const map = { TODO: "badge-todo", IN_PROGRESS: "badge-in-progress", DONE: "badge-done" };
    const labels = { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" };
    return <span className={`badge ${map[status]}`}>{labels[status]}</span>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome back, {userProfile?.name} 👋</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => navigate("/projects")}>
            + New Project
          </button>
        )}
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{s.total || 0}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔵</div>
          <div className="stat-value">{s.todo || 0}</div>
          <div className="stat-label">To Do</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟡</div>
          <div className="stat-value">{s.inProgress || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{s.done || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value" style={{ color: s.overdue > 0 ? "var(--danger)" : undefined }}>{s.overdue || 0}</div>
          <div className="stat-label">Overdue</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-value">{s.projectCount || 0}</div>
          <div className="stat-label">Projects</div>
        </div>
        {isAdmin && (
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{s.teamSize || 0}</div>
            <div className="stat-label">Team Members</div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Recent Tasks</h3>
          {data?.recentTasks?.length ? (
            <div className="task-list">
              {data.recentTasks.map((t) => (
                <div key={t.id} className="task-item" onClick={() => t.projectId && navigate(`/projects/${t.projectId}`)}>
                  <div className="task-title">{t.title}</div>
                  {getStatusBadge(t.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>No tasks yet</p></div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600, color: "var(--danger)" }}>⚠️ Overdue Tasks</h3>
          {data?.overdueTasks?.length ? (
            <div className="task-list">
              {data.overdueTasks.map((t) => (
                <div key={t.id} className="task-item" onClick={() => t.projectId && navigate(`/projects/${t.projectId}`)}>
                  <div className="task-title">{t.title}</div>
                  <div className="task-due overdue">Due {formatDate(t.dueDate)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p style={{ color: "var(--success)" }}>🎉 No overdue tasks!</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
