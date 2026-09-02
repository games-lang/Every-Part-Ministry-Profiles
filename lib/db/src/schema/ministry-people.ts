import {
  boolean,
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
import { ministryProfilesTable } from "./ministry-profiles";

export const ministryPeopleTable = pgTable(
  "ministry_people",
  {
    id: serial("id").primaryKey(),
    churchId: integer("church_id")
      .notNull()
      .references(() => churchesTable.id, { onDelete: "cascade" }),
    profileId: integer("profile_id").references(() => ministryProfilesTable.id, {
      onDelete: "set null",
    }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    addressLine1: text("address_line_1"),
    addressLine2: text("address_line_2"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
    country: text("country"),
    inviteToken: uuid("invite_token").notNull().defaultRandom(),
    inviteStatus: text("invite_status").notNull().default("pending"),
    inviteExpiresAt: timestamp("invite_expires_at", { withTimezone: true }).notNull(),
    inviteSentAt: timestamp("invite_sent_at", { withTimezone: true }),
    source: text("source").notNull().default("manual"),
    externalId: text("external_id"),
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
    uniqueIndex("ministry_people_invite_token_unique").on(table.inviteToken),
  ],
);

export const insertMinistryPersonSchema = createInsertSchema(
  ministryPeopleTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMinistryPerson = z.infer<typeof insertMinistryPersonSchema>;
export type MinistryPerson = typeof ministryPeopleTable.$inferSelect;