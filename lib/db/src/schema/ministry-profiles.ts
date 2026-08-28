import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { churchesTable } from "./churches";

export const ministryProfilesTable = pgTable("ministry_profiles", {
  id: serial("id").primaryKey(),
  churchId: integer("church_id")
    .notNull()
    .references(() => churchesTable.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  ageRange: text("age_range").notNull(),
  preferredContact: text("preferred_contact").notNull(),
  familySituation: text("family_situation").notNull(),
  transportation: text("transportation").notNull(),
  attendanceLength: text("attendance_length").notNull(),
  connectionLevel: integer("connection_level").notNull(),
  followingJesusLength: text("following_jesus_length").notNull(),
  servedBefore: boolean("served_before").notNull(),
  previousService: text("previous_service"),
  passions: text("passions").array().notNull(),
  interests: text("interests").array().notNull(),
  servingFrequency: text("serving_frequency"),
  availability: text("availability").array().notNull(),
  occupation: text("occupation"),
  uniqueSkills: text("unique_skills"),
  previousMinistryExperience: text("previous_ministry_experience"),
  leadershipExperience: text("leadership_experience"),
  missionTripExperience: text("mission_trip_experience"),
  lifeExperience: text("life_experience"),
  apest: jsonb("apest"),
  spiritualGifts: jsonb("spiritual_gifts"),
  personalityStrengths: jsonb("personality_strengths"),
  spiritualHealth: jsonb("spiritual_health"),
  completedAt: timestamp("completed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertMinistryProfileSchema = createInsertSchema(
  ministryProfilesTable,
).omit({
  id: true,
  completedAt: true,
});

export type InsertMinistryProfile = z.infer<
  typeof insertMinistryProfileSchema
>;
export type MinistryProfile = typeof ministryProfilesTable.$inferSelect;
