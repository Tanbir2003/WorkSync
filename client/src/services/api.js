const API_BASE = "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  const { method = "GET", body, token } = options;

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// Auth / Users
export const createUserProfile = (uid, name, email) =>
  request("/users", { method: "POST", body: { uid, name, email } });

export const getUsers = (token) =>
  request("/users", { token });

// Projects
export const getProjects = (token) =>
  request("/projects", { token });

export const getProject = (id, token) =>
  request(`/projects/${id}`, { token });

export const createProject = (data, token) =>
  request("/projects", { method: "POST", body: data, token });

export const deleteProject = (id, token) =>
  request(`/projects/${id}`, { method: "DELETE", token });

// Tasks
export const getTasks = (token, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/tasks${query ? `?${query}` : ""}`, { token });
};

export const createTask = (projectId, data, token) =>
  request(`/projects/${projectId}/tasks`, { method: "POST", body: data, token });

export const updateTask = (taskId, data, token) =>
  request(`/tasks/${taskId}`, { method: "PUT", body: data, token });

export const deleteTask = (taskId, token) =>
  request(`/tasks/${taskId}`, { method: "DELETE", token });

// Dashboard
export const getDashboard = (token) =>
  request("/dashboard", { token });
