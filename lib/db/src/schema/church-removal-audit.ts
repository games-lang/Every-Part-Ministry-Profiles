import {
  check,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { churchesTable } from "./churches";

export const churchRemovalAuditTable = pgTable(
  "church_removal_audit",
  {
    id: serial("id").primaryKey(),
    churchId: integer("church_id")
      .notNull()
      .references(() => churchesTable.id, { onDelete: "cascade" }),
    subjectName: text("subject_name").notNull(),
    actorName: text("actor_name").notNull(),
    actorClerkUserId: text("actor_clerk_user_id"),
    kind: text("kind").notNull(),
    removedAt: timestamp("removed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "church_removal_audit_kind_check",
      sql`${table.kind} in ('profile', 'person')`,
    ),
  ],
);