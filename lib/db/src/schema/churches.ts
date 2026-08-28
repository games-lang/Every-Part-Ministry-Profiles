import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const churchesTable = pgTable(
  "churches",
  {
    id: serial("id").primaryKey(),
    ownerUserId: text("owner_user_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logoUrl: text("logo_url"),
    address: text("address"),
    website: text("website"),
    adminName: text("admin_name").notNull(),
    adminEmail: text("admin_email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("churches_slug_unique").on(table.slug),
    uniqueIndex("churches_owner_user_id_unique").on(table.ownerUserId),
  ],
);

export const insertChurchSchema = createInsertSchema(churchesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChurch = z.infer<typeof insertChurchSchema>;
export type Church = typeof churchesTable.$inferSelect;
