import { clearSession, getToken } from "../auth/authStorage.js";

// Empty API_URL uses Vite's same-origin proxy during local development.
// Set VITE_API_URL when the frontend and backend run on different servers.
const API_URL = import.meta.env?.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(message, status, path, responseMessage) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
    this.responseMessage = responseMessage;
  }
}

export async function api(path, method = "GET", body) {
  const token = getToken();
  let response;

  try {
    response = await fetch(API_URL + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error("Cannot reach the API. Start the backend on port 8080.");
  }

  const json = await readResponse(response);
  if (response.status === 401) {
    clearSession();
    window.dispatchEvent(new Event("auth:expired"));
  }

  if (response.ok && json.success !== false) {
    return json.data;
  }

  throw new ApiError(json.message || getErrorMessage(response.status), response.status, path, json.message);
}

export async function apiList(path) {
  const data = await api(path);
  return Array.isArray(data) ? data : [];
}

async function readResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function getErrorMessage(status) {
  const messages = {
    401: "Your session has expired. Please log in again.",
    403: "Access denied. Your account may not have the role or permission required for this page. Use the portal for your role or contact your administrator.",
    404: "The requested resource was not found."
  };

  return messages[status] || `Request failed (${status})`;
}
