

const API_BASE = "/api/v1";

async function apiRequest(path, { method = "GET", body = null, isFormData = false } = {}) {
  const token = localStorage.getItem("token");

  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    /* no JSON body */
  }

  if (!res.ok) {
    throw new Error((data && data.message) || `Request failed (${res.status})`);
  }
  return data;
}
