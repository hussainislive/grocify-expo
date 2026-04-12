// Vercel serverless function: PATCH /api/items/:id, DELETE /api/items/:id
const { neon } = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-http");
const { pgTable, text, integer, boolean, bigint } = require("drizzle-orm/pg-core");
const { eq, and } = require("drizzle-orm");

const groceryItems = pgTable("grocery_items", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(1),
  purchased: boolean("purchased").notNull().default(false),
  priority: text("priority").notNull().default("medium"),
  updated_at: bigint("updated_at", { mode: "number" }).notNull(),
});

function getDb() {
  const sql = neon(process.env.DATABASE_URL);
  return drizzle({ client: sql });
}

function getUserId(req) {
  try {
    const authHeader = req.headers["authorization"] || "";
    if (!authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    if (typeof payload?.sub !== "string" || !payload.sub) return null;
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  const db = getDb();

  if (req.method === "PATCH") {
    try {
      const { quantity, purchased } = req.body;
      let rows;
      if (quantity !== undefined) {
        const q = Number(quantity);
        if (!Number.isFinite(q) || q < 1 || q > 999) {
          return res.status(400).json({ error: "quantity must be a number between 1 and 999" });
        }
        rows = await db
          .update(groceryItems)
          .set({ quantity: Math.max(1, Math.floor(q)), updated_at: Date.now() })
          .where(and(eq(groceryItems.id, id), eq(groceryItems.user_id, userId)))
          .returning();
      } else {
        const nextPurchased = purchased !== undefined ? Boolean(purchased) : true;
        rows = await db
          .update(groceryItems)
          .set({ purchased: nextPurchased, updated_at: Date.now() })
          .where(and(eq(groceryItems.id, id), eq(groceryItems.user_id, userId)))
          .returning();
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }
      return res.status(200).json({ item: rows[0] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: String(err.message) });
    }
  }

  if (req.method === "DELETE") {
    try {
      await db
        .delete(groceryItems)
        .where(and(eq(groceryItems.id, id), eq(groceryItems.user_id, userId)));
      return res.status(200).json({ message: "Item deleted successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: String(err.message) });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
