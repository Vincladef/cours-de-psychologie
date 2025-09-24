const BASE = import.meta.env.VITE_API_BASE_URL;

async function parseResponse(response: Response) {
  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export async function fetchJson(path: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const payload = await parseResponse(response);
    const message = typeof payload === "string" ? payload : JSON.stringify(payload);
    throw new Error(message || "Requête échouée");
  }

  if (response.status === 204) {
    return null;
  }

  return parseResponse(response);
}

export async function fetchJsonAllow404(path: string) {
  const response = await fetch(`${BASE}${path}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const payload = await parseResponse(response);
    const message = typeof payload === "string" ? payload : JSON.stringify(payload);
    throw new Error(message || "Requête échouée");
  }
  return parseResponse(response);
}

export { BASE as API_BASE_URL };
