// Vercel serverless function: PATCH /api/items/:id, DELETE /api/items/:id
const { neon } = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-http");
const { pgTable, text, integer, boolean, bigint } = require("drizzle-orm/pg-core");
const { eq } = require("drizzle-orm");

const groceryItems = pgTable("grocery_items", {
  id: text("id").primaryKey(),
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

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { id } = req.query;
  const db = getDb();

  if (req.method === "PATCH") {
    try {
      const { quantity, purchased } = req.body;
      let rows;
      if (quantity !== undefined) {
        rows = await db
          .update(groceryItems)
          .set({ quantity: Math.max(1, Math.floor(Number(quantity))), updated_at: Date.now() })
          .where(eq(groceryItems.id, id))
          .returning();
      } else {
        const nextPurchased = purchased !== undefined ? Boolean(purchased) : true;
        rows = await db
          .update(groceryItems)
          .set({ purchased: nextPurchased, updated_at: Date.now() })
          .where(eq(groceryItems.id, id))
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
      await db.delete(groceryItems).where(eq(groceryItems.id, id));
      return res.status(200).json({ message: "Item deleted successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: String(err.message) });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
