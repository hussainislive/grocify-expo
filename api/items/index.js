// Vercel serverless function: GET /api/items, POST /api/items
const { neon } = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-http");
const { pgTable, text, integer, boolean, bigint } = require("drizzle-orm/pg-core");
const { desc } = require("drizzle-orm");

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
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const db = getDb();

  if (req.method === "GET") {
    try {
      const items = await db.select().from(groceryItems).orderBy(desc(groceryItems.updated_at));
      return res.status(200).json({ items });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: String(err.message) });
    }
  }

  if (req.method === "POST") {
    try {
      const { name, category, quantity, priority } = req.body;
      if (!name || !category || !priority) {
        return res.status(400).json({ error: "name, category, and priority are required" });
      }
      const rows = await db
        .insert(groceryItems)
        .values({
          id: crypto.randomUUID(),
          name,
          category,
          quantity: Math.max(1, Number(quantity) || 1),
          purchased: false,
          priority,
          updated_at: Date.now(),
        })
        .returning();
      return res.status(201).json({ item: rows[0] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: String(err.message) });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
