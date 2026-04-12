// Vercel serverless function: GET /api/items, POST /api/items
const { neon } = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-http");
const { pgTable, text, integer, boolean, bigint } = require("drizzle-orm/pg-core");
const { desc, eq, and } = require("drizzle-orm");

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

const VALID_CATEGORIES = new Set(["Produce", "Dairy", "Bakery", "Pantry", "Snacks"]);
const VALID_PRIORITIES = new Set(["low", "medium", "high"]);

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
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const db = getDb();

  if (req.method === "GET") {
    try {
      const items = await db
        .select()
        .from(groceryItems)
        .where(eq(groceryItems.user_id, userId))
        .orderBy(desc(groceryItems.updated_at));
      return res.status(200).json({ items });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: String(err.message) });
    }
  }

  if (req.method === "POST") {
    try {
      const { name, category, quantity, priority } = req.body;

      if (typeof name !== "string" || name.trim().length === 0)
        return res.status(400).json({ error: "name is required" });
      if (name.trim().length > 100)
        return res.status(400).json({ error: "name must be 100 characters or fewer" });
      if (typeof category !== "string" || !VALID_CATEGORIES.has(category))
        return res.status(400).json({ error: "category must be one of: Produce, Dairy, Bakery, Pantry, Snacks" });
      if (typeof priority !== "string" || !VALID_PRIORITIES.has(priority))
        return res.status(400).json({ error: "priority must be one of: low, medium, high" });
      if (quantity !== undefined) {
        const q = Number(quantity);
        if (!Number.isFinite(q) || q < 1 || q > 999)
          return res.status(400).json({ error: "quantity must be a number between 1 and 999" });
      }

      const rows = await db
        .insert(groceryItems)
        .values({
          id: crypto.randomUUID(),
          user_id: userId,
          name: name.trim(),
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
