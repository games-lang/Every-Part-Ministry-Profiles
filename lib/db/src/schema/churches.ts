import {
  integer,
  boolean,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const churchesTable = pgTable(
  "churches",
  {
    id: serial("id").primaryKey(),
    ownerUserId: text("owner_user_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logoUrl: text("logo_url"),
    primaryColor: text("primary_color").notNull().default("#122344"),
    accentColor: text("accent_color").notNull().default("#ED7A59"),
    address: text("address"),
    website: text("website"),
    discoverHallwayCode: text("discover_hallway_code"),
    adminName: text("admin_name").notNull(),
    adminEmail: text("admin_email").notNull(),
    enabledSpiritualGifts: jsonb("enabled_spiritual_gifts").$type<string[]>(),
    integratedAssessmentPilotEnabled: boolean("integrated_assessment_pilot_enabled").notNull().default(true),
    assessmentConfiguration: jsonb("assessment_configuration").$type<unknown>(),
    ministryCustomization: jsonb("ministry_customization").$type<unknown>(),
    earlyAccessStatus: text("early_access_status").notNull().default("early_access"),
    earlyAccessStartDate: timestamp("early_access_start_date", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    foundingChurch: boolean("founding_church").notNull().default(false),
    billingPlan: text("billing_plan").notNull().default("starter"),
    billingStatus: text("billing_status").notNull().default("inactive"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripePriceId: text("stripe_price_id"),
    billingCurrentPeriodEnd: timestamp("billing_current_period_end", {
      withTimezone: true,
    }),
    onboardingCompletedAt: timestamp("onboarding_completed_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("churches_slug_unique").on(table.slug),
    uniqueIndex("churches_owner_user_id_unique").on(table.ownerUserId),
  ],
);

export const insertChurchSchema = createInsertSchema(churchesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChurch = z.infer<typeof insertChurchSchema>;
export type Church = typeof churchesTable.$inferSelect;
