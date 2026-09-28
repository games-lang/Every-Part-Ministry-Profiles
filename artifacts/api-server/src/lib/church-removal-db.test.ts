import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

test("church removals delete related data, deny cross-tenant IDs, and audit the actor", {
  skip: process.env.RUN_INTEGRATED_DB_TESTS !== "1",
}, async () => {
  const {
    db,
    pool,
    churchesTable,
    churchRemovalAuditTable,
    integratedAttemptsTable,
    ministryJourneyEntriesTable,
    ministryJourneysTable,
    ministryPeopleTable,
    ministryProfilesTable,
    ministryTeamSchedulesTable,
    ministryTeamsTable,
    pastorNotesTable,
  } = await import("@workspace/db");
  const { and, count, eq, inArray } = await import("drizzle-orm");
  const { removeChurchPerson, removeChurchProfile } = await import("./church-removal.ts");
  const suffix = randomUUID();
  const slug = `church-removal-${suffix}`;
  const actorClerkUserId = `removal-test-actor-${suffix}`;
  const actorName = "Removal Test Actor";
  const now = new Date();
  const [church] = await db.insert(churchesTable).values({
    name: "Isolated removal test church",
    slug,
    adminName: actorName,
    adminEmail: "removal-test@example.invalid",
  }).returning();
  const [otherChurch] = await db.insert(churchesTable).values({
    name: "Isolated other tenant",
    slug: `${slug}-other`,
    adminName: "Other Tenant",
    adminEmail: "other-removal-test@example.invalid",
  }).returning();

  try {
    const [pendingPerson] = await db.insert(ministryPeopleTable).values({
      churchId: church.id,
      firstName: "Pending",
      lastName: "Invite",
      inviteExpiresAt: new Date(now.getTime() + 86400_000),
    }).returning();
    const pendingBefore = await db.select({ count: count() })
      .from(ministryPeopleTable)
      .where(eq(ministryPeopleTable.churchId, church.id));

    assert.equal(await db.transaction(tx =>
      removeChurchPerson(tx, otherChurch.id, pendingPerson.id, actorClerkUserId, actorName),
    ), false, "person IDs cannot cross tenant boundaries");
    assert.equal(await db.transaction(tx =>
      removeChurchPerson(tx, church.id, pendingPerson.id, actorClerkUserId, actorName),
    ), true);
    const pendingAfter = await db.select({ count: count() })
      .from(ministryPeopleTable)
      .where(eq(ministryPeopleTable.churchId, church.id));
    assert.equal(pendingAfter[0]!.count, pendingBefore[0]!.count - 1);
    assert.equal((await db.select().from(ministryPeopleTable)
      .where(and(
        eq(ministryPeopleTable.churchId, church.id),
        eq(ministryPeopleTable.inviteToken, pendingPerson.inviteToken),
      ))).length, 0, "deleting a pending person invalidates their invitation");

    const [journey] = await db.insert(ministryJourneysTable).values({
      churchId: church.id,
    }).returning();
    const [team] = await db.insert(ministryTeamsTable).values({
      churchId: church.id,
      name: "Archived test team",
      isArchived: true,
    }).returning();
    const [profile] = await db.insert(ministryProfilesTable).values({
      churchId: church.id,
      journeyId: journey.id,
      teamId: team.id,
      firstName: "Directory",
      lastName: "Profile",
      email: "directory-profile@example.invalid",
      passions: [],
      interests: [],
      availability: [],
    }).returning();
    const [remainingProfile] = await db.insert(ministryProfilesTable).values({
      churchId: church.id,
      journeyId: journey.id,
      firstName: "Still",
      lastName: "Here",
      email: "remaining-profile@example.invalid",
      passions: [],
      interests: [],
      availability: [],
    }).returning();
    const [remainingPerson] = await db.insert(ministryPeopleTable).values({
      churchId: church.id,
      profileId: remainingProfile.id,
      firstName: "Still",
      lastName: "Here",
      inviteExpiresAt: new Date(now.getTime() + 86400_000),
    }).returning();
    // Deliberately no ministry_people row: completed directory-only profiles
    // must still be directly removable by profile ID.
    await db.insert(ministryJourneyEntriesTable).values({
      journeyId: journey.id,
      entryType: "check_in",
      occurredAt: "2026-05-01",
      title: "Private journey note",
      description: "Remove this with the profile",
      author: actorName,
    });
    await db.insert(ministryTeamSchedulesTable).values({
      churchId: church.id,
      teamId: team.id,
      profileId: profile.id,
      scheduledDate: "2026-05-01",
      startTime: "09:00",
      role: "Volunteer",
      notes: "Private schedule note",
    });
    await db.insert(pastorNotesTable).values({
      churchId: church.id,
      profileId: profile.id,
      authorClerkUserId: actorClerkUserId,
      whatIHeard: "Private pastor note",
    });
    await db.insert(integratedAttemptsTable).values({
      churchId: church.id,
      tokenHash: `token-${suffix}`,
      sourceHash: `source-${suffix}`,
      snapshot: { fixture: true },
      status: "completed",
      profileId: profile.id,
      expiresAt: new Date(now.getTime() + 86400_000),
      completedAt: now,
    });
    const profilesBefore = await db.select({ count: count() })
      .from(ministryProfilesTable)
      .where(eq(ministryProfilesTable.churchId, church.id));
    assert.equal(await db.transaction(tx =>
      removeChurchProfile(tx, otherChurch.id, profile.id, actorClerkUserId, actorName),
    ), false, "profile IDs cannot cross tenant boundaries");
    assert.equal((await db.select().from(ministryProfilesTable)
      .where(eq(ministryProfilesTable.id, profile.id))).length, 1);

    assert.equal(await db.transaction(tx =>
      removeChurchProfile(tx, church.id, profile.id, actorClerkUserId, actorName),
    ), true);
    const profilesAfter = await db.select({ count: count() })
      .from(ministryProfilesTable)
      .where(eq(ministryProfilesTable.churchId, church.id));
    assert.equal(profilesAfter[0]!.count, profilesBefore[0]!.count - 1);
    assert.equal((await db.select().from(integratedAttemptsTable)
      .where(eq(integratedAttemptsTable.profileId, profile.id))).length, 0);
    assert.equal((await db.select().from(pastorNotesTable)
      .where(eq(pastorNotesTable.profileId, profile.id))).length, 0);
    assert.equal((await db.select().from(ministryTeamSchedulesTable)
      .where(eq(ministryTeamSchedulesTable.profileId, profile.id))).length, 0);
    assert.equal((await db.select().from(ministryJourneyEntriesTable)
      .where(eq(ministryJourneyEntriesTable.journeyId, journey.id))).length, 1,
      "a shared journey's entries must remain for the surviving profile");
    assert.equal((await db.select().from(ministryJourneysTable)
      .where(eq(ministryJourneysTable.id, journey.id))).length, 1);
    assert.equal((await db.select().from(ministryProfilesTable)
      .where(eq(ministryProfilesTable.id, remainingProfile.id))).length, 1);
    assert.equal((await db.select().from(ministryPeopleTable)
      .where(eq(ministryPeopleTable.id, remainingPerson.id))).length, 1);

    assert.equal(await db.transaction(tx =>
      removeChurchPerson(tx, church.id, remainingPerson.id, actorClerkUserId, actorName),
    ), true);
    assert.equal((await db.select().from(ministryJourneyEntriesTable)
      .where(eq(ministryJourneyEntriesTable.journeyId, journey.id))).length, 0,
      "the journey is removed after its last profile is removed");
    assert.equal((await db.select().from(ministryJourneysTable)
      .where(eq(ministryJourneysTable.id, journey.id))).length, 0);
    const [remainingTeam] = await db.select().from(ministryTeamsTable)
      .where(and(
        eq(ministryTeamsTable.id, team.id),
        eq(ministryTeamsTable.churchId, church.id),
      ));
    assert.ok(remainingTeam, "profile removal does not delete the ministry team");
    assert.equal(remainingTeam.isArchived, true, "team archive state remains untouched");

    const audit = await db.select().from(churchRemovalAuditTable)
      .where(eq(churchRemovalAuditTable.churchId, church.id));
    assert.equal(audit.length, 3);
    assert.ok(audit.every(entry =>
      entry.actorClerkUserId === actorClerkUserId && entry.actorName === actorName,
    ), "the durable audit records actor identity and name");
    assert.deepEqual(
      audit.map(entry => entry.kind).sort(),
      ["person", "person", "profile"],
    );
    assert.ok(audit.every(entry => entry.removedAt instanceof Date));
  } finally {
    await db.delete(integratedAttemptsTable)
      .where(inArray(integratedAttemptsTable.churchId, [church.id, otherChurch.id]));
    await db.delete(ministryTeamSchedulesTable)
      .where(inArray(ministryTeamSchedulesTable.churchId, [church.id, otherChurch.id]));
    await db.delete(pastorNotesTable)
      .where(inArray(pastorNotesTable.churchId, [church.id, otherChurch.id]));
    await db.delete(ministryPeopleTable)
      .where(inArray(ministryPeopleTable.churchId, [church.id, otherChurch.id]));
    await db.delete(ministryProfilesTable)
      .where(inArray(ministryProfilesTable.churchId, [church.id, otherChurch.id]));
    await db.delete(ministryJourneysTable)
      .where(inArray(ministryJourneysTable.churchId, [church.id, otherChurch.id]));
    await db.delete(ministryTeamsTable)
      .where(inArray(ministryTeamsTable.churchId, [church.id, otherChurch.id]));
    await db.delete(churchesTable).where(inArray(churchesTable.id, [church.id, otherChurch.id]));
    await pool.end();
  }
});