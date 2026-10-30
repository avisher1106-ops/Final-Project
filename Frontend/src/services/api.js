const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status = 0, serverDetail = "") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.serverDetail = serverDetail;
  }
}

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "We couldn't connect to the server. Make sure it is running and try again.",
      0,
    );
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : "Something went wrong while processing the request.";
    throw new ApiError(detail, response.status, detail);
  }

  return data;
}

export function getApiErrorMessage(error) {
  if (!(error instanceof ApiError)) {
    return "Something went wrong. Please try again in a moment.";
  }

  if (error.status === 0) {
    return "We couldn't connect to the server. Make sure it is running and try again.";
  }

  if (error.status === 404) {
    return "The conversation was not found. It may have been deleted.";
  }

  if (error.status === 422) {
    return "Your message is not valid. Try rephrasing it.";
  }

  if (error.status === 502) {
    return "Echo couldn't answer right now. Please try again.";
  }

  if (error.status >= 500) {
    return "The server ran into a problem. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

export function getConversations() {
  return request("/api/conversations");
}

export function createConversation() {
  return request("/api/conversations", {
    method: "POST",
  });
}

export function getMessages(conversationId) {
  return request(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
  );
}

export function sendMessage(conversationId, content) {
  return request(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    },
  );
}

export function deleteConversation(conversationId) {
  return request(
    `/api/conversations/${encodeURIComponent(conversationId)}`,
    {
      method: "DELETE",
    },
  );
}
