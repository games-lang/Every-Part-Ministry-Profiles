import {
  boolean,
  date,
  foreignKey,
  integer,
  jsonb,
  check,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { churchesTable } from "./churches";
import { ministryTeamsTable } from "./ministry-teams";
import { ministryJourneysTable } from "./ministry-journeys";

export const ministryProfilesTable = pgTable("ministry_profiles", {
  id: serial("id").primaryKey(),
  churchId: integer("church_id")
    .notNull()
    .references(() => churchesTable.id, { onDelete: "cascade" }),
  teamId: integer("team_id"),
  journeyId: uuid("journey_id").references(() => ministryJourneysTable.id, {
    onDelete: "set null",
  }),
  profileType: text("profile_type").notNull().default("adult"),
  recommendedProfileType: text("recommended_profile_type"),
  profileTypeOverridden: boolean("profile_type_overridden").notNull().default(false),
  age: integer("age"),
  birthdate: date("birthdate", { mode: "string" }),
  personKey: uuid("person_key").notNull().defaultRandom(),
  resultToken: uuid("result_token").notNull().defaultRandom(),
  resultExpiresAt: timestamp("result_expires_at", { withTimezone: true }),
  youthResponses: jsonb("youth_responses").$type<unknown>(),
  guardianObservations: jsonb("guardian_observations").$type<unknown>(),
  guardianName: text("guardian_name"),
  guardianEmail: text("guardian_email"),
  guardianConsent: boolean("guardian_consent"),
  profilePhotoPath: text("profile_photo_path"),
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
  integratedAssessment: jsonb("integrated_assessment").$type<unknown>(),
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
  ministryCustomizationSnapshot: jsonb(
    "ministry_customization_snapshot",
  ).$type<unknown>(),
  completedAt: timestamp("completed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  uniqueIndex("ministry_profiles_result_token_unique").on(table.resultToken),
  uniqueIndex("ministry_profiles_church_id_unique").on(table.churchId, table.id),
  check(
    "ministry_profiles_profile_type_check",
    sql`${table.profileType} in ('adult', 'discover', 'explore', 'develop')`,
  ),
  check(
    "ministry_profiles_age_check",
    sql`(
      (${table.profileType} = 'adult' and (${table.age} is null or ${table.age} >= 18))
      or (
        ${table.profileType} in ('discover', 'explore', 'develop')
        and ${table.age} is not null
        and ${table.age} between 6 and 17
        and (
          ${table.profileTypeOverridden} = true
          or (${table.profileType} = 'discover' and ${table.age} between 6 and 8)
          or (${table.profileType} = 'explore' and ${table.age} between 9 and 12)
          or (${table.profileType} = 'develop' and ${table.age} between 13 and 17)
        )
      )
    )`,
  ),
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
