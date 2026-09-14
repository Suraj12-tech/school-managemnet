const API = "http://localhost:8080";

export async function api(path, method = "GET", body) {
  const token = localStorage.getItem("token");
  const response = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    throw new Error(json.message || "Request failed");
  }
  return json.data;
}
