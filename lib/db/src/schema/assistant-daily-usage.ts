import { sql } from "drizzle-orm";
import { check, date, integer, pgTable } from "drizzle-orm/pg-core";

// Public assistant usage is global, not a church's plan or AI-credit balance.
export const assistantDailyUsageTable = pgTable("assistant_daily_usage", {
  utcDay: date("utc_day").primaryKey(),
  callCount: integer("call_count").notNull().default(0),
}, (table) => [
  check("assistant_daily_usage_nonnegative", sql`${table.callCount} >= 0`),
]);
