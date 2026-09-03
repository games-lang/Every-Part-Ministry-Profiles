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
import { churchesTable } from "./churches";

export const earlyAccessWelcomeAcknowledgementsTable = pgTable(
  "early_access_welcome_acknowledgements",
  {
    id: serial("id").primaryKey(),
    churchId: integer("church_id")
      .notNull()
      .references(() => churchesTable.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id").notNull(),
    acknowledgedAt: timestamp("acknowledged_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("early_access_welcome_church_user_unique").on(
      table.churchId,
      table.clerkUserId,
    ),
  ],
);

export const earlyAccessUsageEventsTable = pgTable(
  "early_access_usage_events",
  {
    id: serial("id").primaryKey(),
    churchId: integer("church_id")
      .notNull()
      .references(() => churchesTable.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id"),
    eventType: text("event_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export const insertEarlyAccessUsageEventSchema = createInsertSchema(
  earlyAccessUsageEventsTable,
).omit({
  id: true,
  createdAt: true,
});

export type InsertEarlyAccessUsageEvent = z.infer<
  typeof insertEarlyAccessUsageEventSchema
>;
export type EarlyAccessUsageEvent =
  typeof earlyAccessUsageEventsTable.$inferSelect;