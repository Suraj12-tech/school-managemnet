// Use Vite's same-origin proxy during local development. Set VITE_API_URL
// explicitly for deployments where the API has a different origin.
const API = import.meta.env.VITE_API_URL ?? "";

export async function api(path, method = "GET", body) {
  const token = localStorage.getItem("token");
  let response;
  try {
    response = await fetch(API + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error("Cannot reach the API. Start the backend on port 8080.");
  }
  const text = await response.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth:expired"));
  }

  if (!response.ok || json.success === false) {
    const fallback = response.status === 401
      ? "Your session has expired. Please log in again."
      : response.status === 403
        ? "You do not have permission to perform this action."
        : response.status === 404
          ? "The requested resource was not found."
          : `Request failed (${response.status})`;
    throw new Error(json.message || fallback);
  }
  return json.data;
}

export async function apiList(path) {
  const data = await api(path);
  return Array.isArray(data) ? data : [];
}
