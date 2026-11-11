import { toast } from "sonner";

/**
 * Runs an API call and shows its error as a toast (and an optional success toast).
 * Rethrows so callers can keep their UI open.
 *
 * @template T
 * @param {() => Promise<T>} call - The API call.
 * @param {string} [success] - Success toast text.
 * @returns {Promise<T>}
 */
export async function withToast(call, success) {
  try {
    const result = await call();
    if (success) toast.success(success);
    return result;
  } catch (err) {
    toast.error(err.message);
    throw err;
  }
}
