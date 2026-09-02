import {
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { churchesTable } from "./churches";

export const ministryJourneysTable = pgTable(
  "ministry_journeys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    churchId: integer("church_id")
      .notNull()
      .references(() => churchesTable.id, { onDelete: "cascade" }),
    accessToken: uuid("access_token").notNull().defaultRandom(),
    nextProfileType: text("next_profile_type"),
    nextCheckInDate: date("next_check_in_date", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("ministry_journeys_access_token_unique").on(table.accessToken),
  ],
);

export const ministryJourneyEntriesTable = pgTable(
  "ministry_journey_entries",
  {
    id: serial("id").primaryKey(),
    journeyId: uuid("journey_id")
      .notNull()
      .references(() => ministryJourneysTable.id, { onDelete: "cascade" }),
    entryType: text("entry_type").notNull(),
    occurredAt: date("occurred_at", { mode: "string" }).notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    ministryArea: text("ministry_area"),
    author: text("author").notNull(),
    reflection: text("reflection"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("ministry_journey_entries_journey_date_idx").on(
      table.journeyId,
      table.occurredAt,
      table.id,
    ),
  ],
);

export const insertMinistryJourneySchema = createInsertSchema(
  ministryJourneysTable,
).omit({
  createdAt: true,
  updatedAt: true,
});
export const insertMinistryJourneyEntrySchema = createInsertSchema(
  ministryJourneyEntriesTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMinistryJourney = z.infer<typeof insertMinistryJourneySchema>;
export type MinistryJourney = typeof ministryJourneysTable.$inferSelect;
export type InsertMinistryJourneyEntry = z.infer<
  typeof insertMinistryJourneyEntrySchema
>;
export type MinistryJourneyEntry = typeof ministryJourneyEntriesTable.$inferSelect;