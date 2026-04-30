import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getProjects, createProject, deleteProject } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Projects() {
  const { token, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function loadProjects() {
    if (!token) return;
    try {
      const data = await getProjects(token);
      setProjects(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  useEffect(() => { loadProjects(); }, [token]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await createProject(form, token);
      setForm({ name: "", description: "" });
      setShowModal(false);
      loadProjects();
    } catch (err) { alert(err.message); }
    setSaving(false);
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm("Delete this project and all its tasks?")) return;
    try {
      await deleteProject(id, token);
      loadProjects();
    } catch (err) { alert(err.message); }
  }

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Projects</h2>
          <p>{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>No projects yet</h3>
          <p>{isAdmin ? "Create your first project to get started" : "No projects have been created yet"}</p>
          {isAdmin && <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>}
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((p) => (
            <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
              <h3>{p.name}</h3>
              <p className="project-desc">{p.description || "No description"}</p>
              <div className="project-footer">
                <span>Created {new Date(p.createdAt).toLocaleDateString()}</span>
                {isAdmin && (
                  <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(e, p.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Project</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input id="project-name" className="form-input" placeholder="e.g. Website Redesign" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea id="project-desc" className="form-textarea" placeholder="What is this project about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Creating..." : "Create Project"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
