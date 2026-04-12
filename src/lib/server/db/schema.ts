import { bigint, boolean, index, integer, pgTable, text } from "drizzle-orm/pg-core";

export const groceryItems = pgTable(
  "grocery_items",
  {
    id: text("id").primaryKey(),
    user_id: text("user_id").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    quantity: integer("quantity").notNull().default(1),
    purchased: boolean("purchased").notNull().default(false),
    priority: text("priority").notNull().default("medium"),
    updated_at: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [index("grocery_items_user_id_idx").on(table.user_id)],
);
