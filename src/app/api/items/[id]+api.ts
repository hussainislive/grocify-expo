import {
  getUserIdFromRequest,
  unauthorizedResponse,
} from "@/lib/server/auth";
import {
  deleteGroceryItem,
  setGroceryItemPurchased,
  updateGroceryItemQuantity,
} from "@/lib/server/db-actions";

export async function PATCH(request: Request, { id }: { id: string }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const body = await request.json();

    let item;
    if (body.quantity !== undefined) {
      const q = Number(body.quantity);
      if (!Number.isFinite(q) || q < 1 || q > 999) {
        return Response.json(
          { error: "quantity must be a number between 1 and 999" },
          { status: 400 },
        );
      }
      item = await updateGroceryItemQuantity(id, userId, q);
    } else {
      item = await setGroceryItemPurchased(
        id,
        userId,
        body.purchased ?? true,
      );
    }

    if (!item)
      return Response.json({ error: "Item not found" }, { status: 404 });
    return Response.json({ item });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update item";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { id }: { id: string }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    await deleteGroceryItem(id, userId);
    return Response.json({ message: "Item deleted successfully" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete item";
    return Response.json({ error: message }, { status: 500 });
  }
}
