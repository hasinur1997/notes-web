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
 * @param {unknown} [options.body] - JSON-serializable request body.
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
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
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
   * Loads the signed-in user. Does not redirect on 401 so callers can fall back to signed-out state.
   *
   * @param {AbortSignal} [signal] - Cancels the request.
   * @returns {Promise<{ user: object }>} The current user.
   */
  me: (signal) => apiRequest("/auth/me", { signal, redirectOn401: false }),
};
