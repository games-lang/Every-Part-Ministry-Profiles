import {
  boolean,
  foreignKey,
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
import { ministryTeamsTable } from "./ministry-teams";

export const ministryProfilesTable = pgTable("ministry_profiles", {
  id: serial("id").primaryKey(),
  churchId: integer("church_id")
    .notNull()
    .references(() => churchesTable.id, { onDelete: "cascade" }),
  teamId: integer("team_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  ageRange: text("age_range"),
  preferredContact: text("preferred_contact"),
  familySituation: text("family_situation"),
  transportation: text("transportation"),
  attendanceLength: text("attendance_length"),
  connectionLevel: integer("connection_level"),
  followingJesusLength: text("following_jesus_length"),
  servedBefore: boolean("served_before"),
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
  naturalStrengths: jsonb("natural_strengths"),
  spiritualHealth: jsonb("spiritual_health"),
  languages: jsonb("languages"),
  churchDetails: jsonb("church_details"),
  skillsDetails: jsonb("skills_details"),
  lifeExperiences: jsonb("life_experiences"),
  availabilityDetails: jsonb("availability_details"),
  ministryPreferences: jsonb("ministry_preferences"),
  assessmentConfigurationSnapshot: jsonb(
    "assessment_configuration_snapshot",
  ).$type<unknown>(),
  completedAt: timestamp("completed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  foreignKey({
    columns: [table.teamId, table.churchId],
    foreignColumns: [ministryTeamsTable.id, ministryTeamsTable.churchId],
    name: "ministry_profiles_team_church_fk",
  }),
]);

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
