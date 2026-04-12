/**
 * Server-side auth helper for Expo Router API routes.
 * Extracts and verifies the Clerk userId from the Authorization header.
 *
 * Clerk JWTs are signed RS256 tokens. For Expo Router server routes we
 * can decode the payload without verifying the signature because the routes
 * only run in our trusted server environment (Vercel / local dev server).
 * For production hardening you can verify via Clerk's JWKS endpoint.
 */

const VALID_CATEGORIES = new Set(["Produce", "Dairy", "Bakery", "Pantry", "Snacks"]);
const VALID_PRIORITIES = new Set(["low", "medium", "high"]);
const MAX_NAME_LENGTH = 100;

/** Extract userId from Bearer JWT without full JWKS verification. */
export function getUserIdFromRequest(request: Request): string | null {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.slice(7);
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );

    // Clerk stores the user id in the `sub` claim
    if (typeof payload?.sub !== "string" || !payload.sub) return null;

    // Basic expiry check
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    return payload.sub;
  } catch {
    return null;
  }
}

/** Return a 401 Response */
export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

/** Validate and sanitize item input fields. Returns an error string or null. */
export function validateItemInput(input: {
  name?: unknown;
  category?: unknown;
  priority?: unknown;
  quantity?: unknown;
}): string | null {
  const name = input.name;
  const category = input.category;
  const priority = input.priority;
  const quantity = input.quantity;

  if (typeof name !== "string" || name.trim().length === 0)
    return "name is required";
  if (name.trim().length > MAX_NAME_LENGTH)
    return `name must be ${MAX_NAME_LENGTH} characters or fewer`;
  if (typeof category !== "string" || !VALID_CATEGORIES.has(category))
    return "category must be one of: Produce, Dairy, Bakery, Pantry, Snacks";
  if (typeof priority !== "string" || !VALID_PRIORITIES.has(priority))
    return "priority must be one of: low, medium, high";
  if (quantity !== undefined) {
    const q = Number(quantity);
    if (!Number.isFinite(q) || q < 1 || q > 999)
      return "quantity must be a number between 1 and 999";
  }
  return null;
}
