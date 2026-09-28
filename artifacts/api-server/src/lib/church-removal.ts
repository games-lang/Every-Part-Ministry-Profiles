import { and, eq } from "drizzle-orm";
import {
  db,
  churchRemovalAuditTable,
  integratedAttemptsTable,
  ministryJourneysTable,
  ministryPeopleTable,
  ministryProfilesTable,
  ministryTeamSchedulesTable,
} from "@workspace/db";
import { ObjectNotFoundError, ObjectStorageService } from "./objectStorage";
export { canRemoveChurchRecords } from "./church-removal-access";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class ProfilePhotoCleanupError extends Error {
  constructor() {
    super("Unable to remove the profile photo from object storage.");
    this.name = "ProfilePhotoCleanupError";
  }
}

const storage = new ObjectStorageService();

async function deleteProfilePhoto(path: string, churchId: number) {
  if (!path.startsWith(`/objects/profile-photos/${churchId}/`)) {
    throw new ProfilePhotoCleanupError();
  }
  try {
    await storage.deleteObject(path);
  } catch (error) {
    if (!(error instanceof ObjectNotFoundError)) {
      throw new ProfilePhotoCleanupError();
    }
  }
}

// Object storage and PostgreSQL cannot share a transaction. If a later
// database operation fails, the profile transaction rolls back but the photo
// deletion does not; deliberately do not attempt to recreate the photo.
async function removeProfileRecords(
  tx: Transaction,
  churchId: number,
  profileId: number,
  actorClerkUserId: string,
  actorName: string,
  subjectName: string,
  kind: "profile" | "person",
): Promise<boolean> {
  const [profile] = await tx
    .select()
    .from(ministryProfilesTable)
    .where(
      and(
        eq(ministryProfilesTable.id, profileId),
        eq(ministryProfilesTable.churchId, churchId),
      ),
    )
    .for("update")
    .limit(1);
  if (!profile) return false;

  if (profile.profilePhotoPath) {
    await deleteProfilePhoto(profile.profilePhotoPath, churchId);
  }

  // Attempts use RESTRICT so remove the linked private draft/result explicitly.
  await tx
    .delete(integratedAttemptsTable)
    .where(
      and(
        eq(integratedAttemptsTable.churchId, churchId),
        eq(integratedAttemptsTable.profileId, profile.id),
      ),
    );
  await tx
    .delete(ministryPeopleTable)
    .where(
      and(
        eq(ministryPeopleTable.churchId, churchId),
        eq(ministryPeopleTable.profileId, profile.id),
      ),
    );
  await tx
    .delete(ministryTeamSchedulesTable)
    .where(
      and(
        eq(ministryTeamSchedulesTable.churchId, churchId),
        eq(ministryTeamSchedulesTable.profileId, profile.id),
      ),
    );

  await tx
    .delete(ministryProfilesTable)
    .where(
      and(
        eq(ministryProfilesTable.id, profile.id),
        eq(ministryProfilesTable.churchId, churchId),
      ),
    );
  if (profile.journeyId) {
    // Keep a shared journey and its entries intact for any surviving profile.
    const [remaining] = await tx
      .select({ id: ministryProfilesTable.id })
      .from(ministryProfilesTable)
      .where(eq(ministryProfilesTable.journeyId, profile.journeyId))
      .limit(1);
    if (!remaining) {
      await tx
        .delete(ministryJourneysTable)
        .where(
          and(
            eq(ministryJourneysTable.id, profile.journeyId),
            eq(ministryJourneysTable.churchId, churchId),
          ),
        );
    }
  }
  await tx.insert(churchRemovalAuditTable).values({
    churchId,
    subjectName,
    actorName,
    actorClerkUserId,
    kind,
  });
  return true;
}

export async function removeChurchProfile(
  tx: Transaction,
  churchId: number,
  profileId: number,
  actorClerkUserId: string,
  actorName: string,
): Promise<boolean> {
  const [profile] = await tx
    .select({
      firstName: ministryProfilesTable.firstName,
      lastName: ministryProfilesTable.lastName,
    })
    .from(ministryProfilesTable)
    .where(
      and(
        eq(ministryProfilesTable.id, profileId),
        eq(ministryProfilesTable.churchId, churchId),
      ),
    )
    .limit(1);
  if (!profile) return false;
  return removeProfileRecords(
    tx,
    churchId,
    profileId,
    actorClerkUserId,
    actorName,
    `${profile.firstName} ${profile.lastName}`.trim(),
    "profile",
  );
}

export async function removeChurchPerson(
  tx: Transaction,
  churchId: number,
  personId: number,
  actorClerkUserId: string,
  actorName: string,
): Promise<boolean> {
  const [person] = await tx
    .select()
    .from(ministryPeopleTable)
    .where(
      and(
        eq(ministryPeopleTable.id, personId),
        eq(ministryPeopleTable.churchId, churchId),
      ),
    )
    .limit(1);
  if (!person) return false;
  const subjectName = `${person.firstName} ${person.lastName}`.trim();

  if (person.profileId) {
    const removedProfile = await removeProfileRecords(
      tx,
      churchId,
      person.profileId,
      actorClerkUserId,
      actorName,
      subjectName,
      "person",
    );
    if (removedProfile) return true;
  }

  const [removedPerson] = await tx
    .delete(ministryPeopleTable)
    .where(
      and(
        eq(ministryPeopleTable.id, person.id),
        eq(ministryPeopleTable.churchId, churchId),
      ),
    )
    .returning({ id: ministryPeopleTable.id });
  if (!removedPerson) return false;
  await tx.insert(churchRemovalAuditTable).values({
    churchId,
    subjectName,
    actorName,
    actorClerkUserId,
    kind: "person",
  });
  return true;
}