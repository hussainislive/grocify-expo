import {
  getUserIdFromRequest,
  unauthorizedResponse,
  validateItemInput,
} from "@/lib/server/auth";
import { createGroceryItem, listGroceryItems } from "@/lib/server/db-actions";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const items = await listGroceryItems(userId);
    return Response.json({ items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch items";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { name, category, quantity, priority } = body;

    const validationError = validateItemInput({ name, category, priority, quantity });
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const item = await createGroceryItem(userId, {
      name,
      category,
      quantity: Number(quantity) || 1,
      priority,
    });
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create item";
    return Response.json({ error: message }, { status: 500 });
  }
}
