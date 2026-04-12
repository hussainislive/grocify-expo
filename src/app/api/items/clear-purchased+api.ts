import {
  getUserIdFromRequest,
  unauthorizedResponse,
} from "@/lib/server/auth";
import { clearPurchasedItems } from "@/lib/server/db-actions";

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    await clearPurchasedItems(userId);
    return Response.json({ message: "Purchased items cleared successfully" });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to clear purchased items";
    return Response.json({ error: message }, { status: 500 });
  }
}
