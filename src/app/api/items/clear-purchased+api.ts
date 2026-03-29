import { clearPurchasedItems } from "@/lib/server/db-actions";

export async function POST() {
  try {
    await clearPurchasedItems();
    return Response.json({ message: "Purchased items cleared successfully" });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to clear purchased items";
    return Response.json({ error: message }, { status: 500 });
  }
}
