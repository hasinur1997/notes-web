/**
 * The only module that talks to the Notes API.
 * Prefixes NEXT_PUBLIC_API_URL, attaches the Bearer token, normalizes errors,
 * and ends the session when an authenticated request returns 401.
 */
import { clearToken, getToken } from "@/lib/token";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const GENERIC_ERROR = "Something went wrong. Please try again.";
const NETWORK_ERROR = "Cannot reach the server. Check your connection and try again.";

/**
 * Error thrown for every failed API call. `message` is safe to show in a toast.
 */
export class ApiRequestError extends Error {
  /**
   * @param {string} message - Human-readable message from the API (or a generic fallback).
   * @param {number} status - HTTP status, or 0 when the server could not be reached.
   * @param {string} [code] - Machine-readable error code from the API, e.g. `DUPLICATE_KEY`.
   */
  constructor(message, status, code) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

/** Parses a JSON response body, returning null for empty or non-JSON bodies. */
async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

let unauthorizedHandler = null;

/**
 * Registers the function called when an authenticated request returns 401
 * (expired token or deleted account). AuthProvider uses it to reset state and go to /login.
 *
 * @param {(() => void) | null} handler - Callback, or null to unregister.
 * @returns {void}
 */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

/** Clears the stored token and notifies the registered handler. */
function handleSessionEnded() {
  clearToken();
  unauthorizedHandler?.();
}

/**
 * Sends a request to the API.
 *
 * @param {string} path - Path below the API root, e.g. `/auth/register`.
 * @param {object} [options]
 * @param {string} [options.method="GET"] - HTTP method.
 * @param {unknown} [options.body] - JSON-serializable request body, or FormData for uploads.
 * @param {AbortSignal} [options.signal] - Cancels the request.
 * @param {boolean} [options.redirectOn401=true] - End the session (and go to /login) when an authenticated request gets 401.
 * @returns {Promise<any>} Parsed JSON response, or null for empty responses.
 * @throws {ApiRequestError} On network failure or any non-2xx response.
 */
export async function apiRequest(path, { method = "GET", body, signal, redirectOn401 = true } = {}) {
  if (!API_URL) {
    throw new ApiRequestError("The app is not configured: NEXT_PUBLIC_API_URL is missing.", 0, "CONFIG_ERROR");
  }

  const token = getToken();
  const isForm = body instanceof FormData;
  const headers = {};
  // FormData sets its own multipart Content-Type (with the boundary).
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined || isForm ? body : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    throw new ApiRequestError(NETWORK_ERROR, 0, "NETWORK_ERROR");
  }

  const data = await readJson(response);

  if (!response.ok) {
    // Only an authenticated request means "your session ended"; a 401 from login means wrong credentials.
    if (response.status === 401 && token && redirectOn401) handleSessionEnded();
    throw new ApiRequestError(data?.error?.message ?? GENERIC_ERROR, response.status, data?.error?.code);
  }

  return data;
}

/** Auth endpoints. */
export const authApi = {
  /**
   * Creates an account. The API always assigns the `user` role.
   *
   * @param {{ name: string, email: string, password: string }} values - New account details.
   * @returns {Promise<{ token: string, user: object }>} Token and the created user.
   */
  register: (values) => apiRequest("/auth/register", { method: "POST", body: values }),

  /**
   * Exchanges email and password for an access token.
   * A 401 here means wrong credentials, so it never ends a session or redirects.
   *
   * @param {{ email: string, password: string }} credentials - Sign-in details.
   * @returns {Promise<{ token: string, user: object }>} Token and the signed-in user.
   */
  login: (credentials) => apiRequest("/auth/login", { method: "POST", body: credentials, redirectOn401: false }),

  /**
   * Loads the signed-in user. Does not redirect on 401 so callers can fall back to signed-out state.
   *
   * @param {AbortSignal} [signal] - Cancels the request.
   * @returns {Promise<{ user: object }>} The current user.
   */
  me: (signal) => apiRequest("/auth/me", { signal, redirectOn401: false }),
};

/** Builds a query string from defined, non-empty values only. */
function toQueryString(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** Notes endpoints. Every call acts on the signed-in user's own notes. */
export const notesApi = {
  /**
   * Lists notes, newest first.
   *
   * @param {{ page?: number, limit?: number, pinned?: boolean, label?: string, q?: string, reminder?: boolean }} params - Filters and paging.
   * @param {AbortSignal} [signal] - Cancels the request.
   * @returns {Promise<{ data: object[], meta: { page: number, limit: number, total: number, totalPages: number } }>}
   */
  list: (params, signal) => apiRequest(`/notes${toQueryString(params)}`, { signal }),

  /**
   * Loads the sidebar summary: total notes and label counts.
   *
   * @param {AbortSignal} [signal] - Cancels the request.
   * @returns {Promise<{ totalNotes: number, labels: { name: string, count: number }[] }>}
   */
  summary: (signal) => apiRequest("/notes/summary", { signal }),

  /**
   * Creates a note.
   *
   * @param {{ title: string, content?: string, labels?: string[], pinned?: boolean }} values - Note fields.
   * @returns {Promise<{ note: object }>}
   */
  create: (values) => apiRequest("/notes", { method: "POST", body: values }),

  /**
   * Updates some fields of a note.
   *
   * @param {string} id - Note id.
   * @param {{ title?: string, content?: string, labels?: string[], pinned?: boolean }} values - Fields to change.
   * @returns {Promise<{ note: object }>}
   */
  update: (id, values) => apiRequest(`/notes/${encodeURIComponent(id)}`, { method: "PATCH", body: values }),

  /**
   * Deletes a note.
   *
   * @param {string} id - Note id.
   * @returns {Promise<null>}
   */
  remove: (id) => apiRequest(`/notes/${encodeURIComponent(id)}`, { method: "DELETE" }),

  /**
   * Renames a label on all of the user's notes.
   *
   * @param {string} from - Current label.
   * @param {string} to - New label.
   * @returns {Promise<{ label: string, notesUpdated: number }>}
   */
  renameLabel: (from, to) =>
    apiRequest(`/notes/labels/${encodeURIComponent(from)}`, { method: "PATCH", body: { name: to } }),

  /**
   * Removes a label from all of the user's notes (the notes stay).
   *
   * @param {string} name - Label to remove.
   * @returns {Promise<null>}
   */
  deleteLabel: (name) => apiRequest(`/notes/labels/${encodeURIComponent(name)}`, { method: "DELETE" }),

  /**
   * Copies a note into a new note owned by the user.
   *
   * @param {string} id - Note id.
   * @returns {Promise<{ note: object }>}
   */
  copy: (id) => apiRequest(`/notes/${encodeURIComponent(id)}/copy`, { method: "POST" }),

  /**
   * Shares a note with a registered user (owner only).
   *
   * @param {string} id - Note id.
   * @param {string} email - The person's email.
   * @returns {Promise<{ note: object }>}
   */
  addCollaborator: (id, email) =>
    apiRequest(`/notes/${encodeURIComponent(id)}/collaborators`, { method: "POST", body: { email } }),

  /**
   * Removes a collaborator (owner), or leaves the note (collaborator removing themselves).
   *
   * @param {string} id - Note id.
   * @param {string} userId - Person to remove.
   * @returns {Promise<null>}
   */
  removeCollaborator: (id, userId) =>
    apiRequest(`/notes/${encodeURIComponent(id)}/collaborators/${encodeURIComponent(userId)}`, { method: "DELETE" }),

  /**
   * Uploads one image to a note.
   *
   * @param {string} id - Note id.
   * @param {File} file - JPEG, PNG, WebP or GIF up to 5 MB.
   * @returns {Promise<{ note: object }>}
   */
  uploadImage: (id, file) => {
    const form = new FormData();
    form.append("image", file);
    return apiRequest(`/notes/${encodeURIComponent(id)}/images`, { method: "POST", body: form });
  },

  /**
   * Removes an image from a note.
   *
   * @param {string} id - Note id.
   * @param {string} imageId - Image id.
   * @returns {Promise<{ note: object }>}
   */
  removeImage: (id, imageId) =>
    apiRequest(`/notes/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}`, { method: "DELETE" }),
};
