import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { churchesTable } from "./churches";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appFeedbackTable = pgTable("app_feedback", {
  id: serial("id").primaryKey(),
  churchId: integer("church_id").references(() => churchesTable.id, {
    onDelete: "set null",
  }),
  type: text("type").notNull().default("suggestion"),
  category: text("category").notNull().default("other"),
  priority: text("priority").notNull().default("medium"),
  message: text("message").notNull(),
  contactEmail: text("contact_email"),
  sourcePage: text("source_page").notNull().default("sign-in"),
  status: text("status").notNull().default("new"),
  adminResponse: text("admin_response"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertAppFeedbackSchema = createInsertSchema(appFeedbackTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppFeedback = z.infer<typeof insertAppFeedbackSchema>;
export type AppFeedback = typeof appFeedbackTable.$inferSelect;