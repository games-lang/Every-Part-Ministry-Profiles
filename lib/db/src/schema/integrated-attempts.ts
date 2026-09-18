import { check, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { churchesTable } from "./churches";
import { ministryProfilesTable } from "./ministry-profiles";

export const integratedAttemptsTable = pgTable("integrated_assessment_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  churchId: integer("church_id").notNull().references(() => churchesTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  sourceHash: text("source_hash").notNull(),
  revision: integer("revision").notNull().default(0),
  status: text("status").notNull().default("draft"),
  snapshot: jsonb("snapshot").$type<unknown>().notNull(),
  answers: jsonb("answers").$type<Record<string, unknown>>().notNull().default({}),
  formState: jsonb("form_state").$type<Record<string, unknown>>().notNull().default({}),
  profileId: integer("profile_id").references(() => ministryProfilesTable.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, table => [
  uniqueIndex("integrated_attempt_token_hash_unique").on(table.tokenHash),
  uniqueIndex("integrated_attempt_profile_unique").on(table.profileId),
  index("integrated_attempt_church_created_idx").on(table.churchId, table.createdAt),
  index("integrated_attempt_source_created_idx").on(table.sourceHash, table.createdAt),
  check("integrated_attempt_state_check", sql`${table.revision} >= 0 AND ((${table.status} = 'draft' AND ${table.profileId} IS NULL AND ${table.completedAt} IS NULL) OR (${table.status} = 'completed' AND ${table.profileId} IS NOT NULL AND ${table.completedAt} IS NOT NULL))`),
]);
export type IntegratedAttempt = typeof integratedAttemptsTable.$inferSelect;