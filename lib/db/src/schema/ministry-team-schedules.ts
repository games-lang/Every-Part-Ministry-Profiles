import {
  boolean,
  date,
  foreignKey,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { churchesTable } from "./churches";
import { ministryProfilesTable } from "./ministry-profiles";
import { ministryTeamsTable } from "./ministry-teams";

export const ministryTeamSchedulesTable = pgTable(
  "ministry_team_schedules",
  {
    id: serial("id").primaryKey(),
    churchId: integer("church_id")
      .notNull()
      .references(() => churchesTable.id, { onDelete: "cascade" }),
    teamId: integer("team_id").notNull(),
    profileId: integer("profile_id").references(() => ministryProfilesTable.id, {
      onDelete: "set null",
    }),
    scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time"),
    role: text("role").notNull(),
    notes: text("notes"),
    isCancelled: boolean("is_cancelled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.teamId, table.churchId],
      foreignColumns: [ministryTeamsTable.id, ministryTeamsTable.churchId],
      name: "ministry_team_schedules_team_church_fk",
    }),
  ],
);

export const insertMinistryTeamScheduleSchema = createInsertSchema(
  ministryTeamSchedulesTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMinistryTeamSchedule = z.infer<
  typeof insertMinistryTeamScheduleSchema
>;
export type MinistryTeamSchedule =
  typeof ministryTeamSchedulesTable.$inferSelect;