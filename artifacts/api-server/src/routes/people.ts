import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { and, asc, eq, gt } from "drizzle-orm";
import {
  CreatePersonBody,
  CreatePersonResponse,
  ImportPeopleBody,
  ImportPeopleResponse,
  CreatePersonInviteParams,
  CreatePersonInviteResponse,
  GetPublicPersonInviteParams,
  GetPublicPersonInviteResponse,
  ListPeopleResponse,
} from "@workspace/api-zod";
import {
  churchesTable,
  db,
  ministryPeopleTable,
} from "@workspace/db";
import { requireUserId } from "../lib/auth";
import { getOrCreateChurch } from "../lib/churches";

const router: IRouter = Router();
const INVITE_LIFETIME_DAYS = 30;

function inviteExpiration() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_LIFETIME_DAYS);
  return expiresAt;
}

function normalizeOptional(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function personResponse(person: typeof ministryPeopleTable.$inferSelect) {
  return {
    id: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    email: person.email,
    phone: person.phone,
    addressLine1: person.addressLine1,
    addressLine2: person.addressLine2,
    city: person.city,
    state: person.state,
    postalCode: person.postalCode,
    country: person.country,
    inviteToken: person.inviteToken,
    inviteStatus:
      person.inviteStatus === "pending" &&
      person.inviteExpiresAt.getTime() <= Date.now()
        ? "expired"
        : person.inviteStatus,
    inviteExpiresAt: person.inviteExpiresAt,
    inviteSentAt: person.inviteSentAt,
    source: person.source,
    profileId: person.profileId,
    isArchived: person.isArchived,
    createdAt: person.createdAt,
  };
}

router.get("/people", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const church = await getOrCreateChurch(userId);
  const people = await db
    .select()
    .from(ministryPeopleTable)
    .where(
      and(
        eq(ministryPeopleTable.churchId, church.id),
        eq(ministryPeopleTable.isArchived, false),
      ),
    )
    .orderBy(asc(ministryPeopleTable.lastName), asc(ministryPeopleTable.firstName));

  res.json(ListPeopleResponse.parse(people.map(personResponse)));
});

router.post("/people", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = CreatePersonBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid person");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const church = await getOrCreateChurch(userId);
  const [person] = await db
    .insert(ministryPeopleTable)
    .values({
      churchId: church.id,
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
      email: normalizeOptional(parsed.data.email),
      phone: normalizeOptional(parsed.data.phone),
      addressLine1: normalizeOptional(parsed.data.addressLine1),
      addressLine2: normalizeOptional(parsed.data.addressLine2),
      city: normalizeOptional(parsed.data.city),
      state: normalizeOptional(parsed.data.state),
      postalCode: normalizeOptional(parsed.data.postalCode),
      country: normalizeOptional(parsed.data.country),
      inviteExpiresAt: inviteExpiration(),
      inviteSentAt: new Date(),
      source: "manual",
    })
    .returning();

  if (!person) throw new Error("Unable to add person");
  res.status(201).json(CreatePersonResponse.parse(personResponse(person)));
});

router.post("/people/import", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = ImportPeopleBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid people import");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const church = await getOrCreateChurch(userId);
  const existing = await db
    .select({
      email: ministryPeopleTable.email,
      firstName: ministryPeopleTable.firstName,
      lastName: ministryPeopleTable.lastName,
    })
    .from(ministryPeopleTable)
    .where(
      and(
        eq(ministryPeopleTable.churchId, church.id),
        eq(ministryPeopleTable.isArchived, false),
      ),
    );
  const existingEmails = new Set(
    existing
      .map((person) => person.email?.trim().toLocaleLowerCase())
      .filter((email): email is string => Boolean(email)),
  );
  const seenEmails = new Set<string>();
  const skipped: Array<{ row: number; reason: string }> = [];
  const rowsToCreate: Array<{
    row: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  }> = [];

  parsed.data.people.forEach((person, index) => {
    const row = index + 2;
    const email = normalizeOptional(person.email);
    const emailKey = email?.toLocaleLowerCase();
    if (emailKey && (existingEmails.has(emailKey) || seenEmails.has(emailKey))) {
      skipped.push({ row, reason: "A person with this email is already in the church list." });
      return;
    }
    if (emailKey) seenEmails.add(emailKey);
    rowsToCreate.push({
      row,
      firstName: person.firstName.trim(),
      lastName: person.lastName.trim(),
      email,
      phone: normalizeOptional(person.phone),
      addressLine1: normalizeOptional(person.addressLine1),
      addressLine2: normalizeOptional(person.addressLine2),
      city: normalizeOptional(person.city),
      state: normalizeOptional(person.state),
      postalCode: normalizeOptional(person.postalCode),
      country: normalizeOptional(person.country),
    });
  });

  const created = rowsToCreate.length
    ? await db
        .insert(ministryPeopleTable)
        .values(
          rowsToCreate.map((person) => ({
            churchId: church.id,
            firstName: person.firstName,
            lastName: person.lastName,
            email: person.email,
            phone: person.phone,
            addressLine1: person.addressLine1,
            addressLine2: person.addressLine2,
            city: person.city,
            state: person.state,
            postalCode: person.postalCode,
            country: person.country,
            inviteExpiresAt: inviteExpiration(),
            inviteSentAt: new Date(),
            source: "csv",
          })),
        )
        .returning()
    : [];

  res.status(201).json(
    ImportPeopleResponse.parse({
      created: created.map(personResponse),
      skipped,
    }),
  );
});

router.post("/people/:id/invite", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const params = CreatePersonInviteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const church = await getOrCreateChurch(userId);
  const [person] = await db
    .update(ministryPeopleTable)
    .set({
      inviteToken: randomUUID(),
      inviteStatus: "pending",
      inviteExpiresAt: inviteExpiration(),
      inviteSentAt: new Date(),
      profileId: null,
    })
    .where(
      and(
        eq(ministryPeopleTable.id, params.data.id),
        eq(ministryPeopleTable.churchId, church.id),
        eq(ministryPeopleTable.isArchived, false),
      ),
    )
    .returning();

  if (!person) {
    res.status(404).json({ error: "Person not found" });
    return;
  }

  res.json(CreatePersonInviteResponse.parse(personResponse(person)));
});

router.get("/people/invites/:token", async (req, res): Promise<void> => {
  const params = GetPublicPersonInviteParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ error: "Invitation not found or expired" });
    return;
  }

  const [result] = await db
    .select({
      person: ministryPeopleTable,
      church: churchesTable,
    })
    .from(ministryPeopleTable)
    .innerJoin(churchesTable, eq(churchesTable.id, ministryPeopleTable.churchId))
    .where(
      and(
        eq(ministryPeopleTable.inviteToken, params.data.token),
        eq(ministryPeopleTable.inviteStatus, "pending"),
        eq(ministryPeopleTable.isArchived, false),
        gt(ministryPeopleTable.inviteExpiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!result) {
    res.status(404).json({ error: "Invitation not found or expired" });
    return;
  }

  res.json(
    GetPublicPersonInviteResponse.parse({
      churchSlug: result.church.slug,
      churchName: result.church.name,
      firstName: result.person.firstName,
      lastName: result.person.lastName,
      email: result.person.email,
      phone: result.person.phone,
      inviteExpiresAt: result.person.inviteExpiresAt,
    }),
  );
});

export default router;