import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { churchesTable } from "./churches";

export type PartFinderLeadershipProfileData = {
  priorities: string[];
  energizingAreas: string;
  drainingAreas: string;
  delegationNeeds: string;
  churchChallenges: string;
  strengthenAreas: string;
  leadersToDevelop: string;
  leadershipStrengths: string[];
  growthAreas: string[];
  goals3Months: string;
  goals1Year: string;
  helpPreferences: string[];
  coachingStyle: "encouraging" | "balanced" | "direct";
  responseLength: "brief" | "standard" | "detailed";
};

export const partFinderLeadershipProfilesTable = pgTable(
  "partfinder_leadership_profiles",
  {
    id: serial("id").primaryKey(),
    churchId: integer("church_id")
      .notNull()
      .references(() => churchesTable.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id").notNull(),
    profile: jsonb("profile")
      .$type<PartFinderLeadershipProfileData>()
      .notNull(),
    personalizationEnabled: boolean("personalization_enabled")
      .notNull()
      .default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("partfinder_leadership_profiles_church_user_unique").on(
      table.churchId,
      table.clerkUserId,
    ),
  ],
);

export type PartFinderLeadershipProfile =
  typeof partFinderLeadershipProfilesTable.$inferSelect;