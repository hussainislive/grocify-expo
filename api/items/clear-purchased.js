// Vercel serverless function: POST /api/items/clear-purchased
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
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const db = getDb();
    await db
      .delete(groceryItems)
      .where(and(eq(groceryItems.user_id, userId), eq(groceryItems.purchased, true)));
    return res.status(200).json({ message: "Purchased items cleared successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err.message) });
  }
};
