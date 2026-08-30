import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { churchesTable } from "./churches";

export const ministryTeamsTable = pgTable(
  "ministry_teams",
  {
    id: serial("id").primaryKey(),
    churchId: integer("church_id")
      .notNull()
      .references(() => churchesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("ministry_teams_id_church_id_unique").on(
      table.id,
      table.churchId,
    ),
    uniqueIndex("ministry_teams_church_name_unique").on(
      table.churchId,
      sql`lower(btrim(${table.name}))`,
    ),
  ],
);

export const insertMinistryTeamSchema = createInsertSchema(
  ministryTeamsTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMinistryTeam = z.infer<typeof insertMinistryTeamSchema>;
export type MinistryTeam = typeof ministryTeamsTable.$inferSelect;