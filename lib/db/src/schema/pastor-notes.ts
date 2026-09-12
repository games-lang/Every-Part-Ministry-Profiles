import {
  date,
  foreignKey,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { churchesTable } from "./churches";
import { ministryProfilesTable } from "./ministry-profiles";

export const pastorNotesTable = pgTable(
  "pastor_notes",
  {
    id: serial("id").primaryKey(),
    churchId: integer("church_id").notNull().references(() => churchesTable.id, { onDelete: "cascade" }),
    profileId: integer("profile_id").notNull(),
    authorClerkUserId: text("author_clerk_user_id").notNull(),
    whatIHeard: text("what_i_heard").notNull().default(""),
    bringsLife: text("brings_life").notNull().default(""),
    areasToExplore: text("areas_to_explore").notNull().default(""),
    areasToAvoidForNow: text("areas_to_avoid_for_now").notNull().default(""),
    trainingNeeded: text("training_needed").notNull().default(""),
    nextStep: text("next_step").notNull().default(""),
    followUpDate: date("follow_up_date", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    unique("pastor_notes_profile_author_unique").on(table.profileId, table.authorClerkUserId),
    foreignKey({
      columns: [table.profileId, table.churchId],
      foreignColumns: [ministryProfilesTable.id, ministryProfilesTable.churchId],
      name: "pastor_notes_profile_church_fk",
    }),
  ],
);

export const insertPastorNoteSchema = createInsertSchema(pastorNotesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPastorNote = z.infer<typeof insertPastorNoteSchema>;
export type PastorNote = typeof pastorNotesTable.$inferSelect;