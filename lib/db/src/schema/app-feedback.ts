import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appFeedbackTable = pgTable("app_feedback", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("suggestion"),
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