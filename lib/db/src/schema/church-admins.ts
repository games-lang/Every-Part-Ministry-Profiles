import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { churchesTable } from "./churches.ts";

export const churchAdminsTable = pgTable(
  "church_admins",
  {
    id: serial("id").primaryKey(),
    churchId: integer("church_id")
      .notNull()
      .references(() => churchesTable.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default("admin"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("church_admins_church_user_unique").on(
      table.churchId,
      table.clerkUserId,
    ),
    unique("church_admins_church_email_unique").on(
      table.churchId,
      table.email,
    ),
  ],
);

export const insertChurchAdminSchema = createInsertSchema(churchAdminsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertChurchAdmin = z.infer<typeof insertChurchAdminSchema>;
export type ChurchAdmin = typeof churchAdminsTable.$inferSelect;