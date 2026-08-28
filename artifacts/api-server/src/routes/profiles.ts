import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  CreateProfileBody,
  CreateProfileResponse,
  GetProfileParams,
  GetProfileResponse,
  ListProfilesQueryParams,
  ListProfilesResponse,
} from "@workspace/api-zod";
import { churchesTable, db, ministryProfilesTable } from "@workspace/db";
import { requireUserId } from "../lib/auth";
import { getOrCreateChurch } from "../lib/churches";
import { profileListItem, profileResponse } from "../lib/profiles";

const router: IRouter = Router();

router.get("/profiles", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = ListProfilesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const church = await getOrCreateChurch(userId);
  const profiles = await db
    .select()
    .from(ministryProfilesTable)
    .where(eq(ministryProfilesTable.churchId, church.id))
    .orderBy(desc(ministryProfilesTable.completedAt));

  const search = parsed.data.search?.trim().toLowerCase();
  const filtered = profiles.filter((profile) => {
    const name = `${profile.firstName} ${profile.lastName}`.toLowerCase();
    if (search && !name.includes(search) && !profile.email.toLowerCase().includes(search)) {
      return false;
    }
    if (parsed.data.interest && !profile.interests.includes(parsed.data.interest)) {
      return false;
    }
    if (parsed.data.passion && !profile.passions.includes(parsed.data.passion)) {
      return false;
    }
    if (
      parsed.data.availability &&
      !profile.availability.includes(parsed.data.availability)
    ) {
      return false;
    }
    return true;
  });

  res.json(ListProfilesResponse.parse(filtered.map(profileListItem)));
});

router.post("/profiles", async (req, res): Promise<void> => {
  const parsed = CreateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid Ministry Profile");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [church] = await db
    .select()
    .from(churchesTable)
    .where(eq(churchesTable.slug, parsed.data.churchSlug))
    .limit(1);

  if (!church) {
    res.status(404).json({ error: "Church not found" });
    return;
  }

  const { basicInformation, churchConnection, skills } = parsed.data;
  const [created] = await db
    .insert(ministryProfilesTable)
    .values({
      churchId: church.id,
      firstName: basicInformation.firstName,
      lastName: basicInformation.lastName,
      email: basicInformation.email,
      phone: basicInformation.phone,
      ageRange: basicInformation.ageRange,
      preferredContact: basicInformation.preferredContact,
      familySituation: basicInformation.familySituation,
      transportation: basicInformation.transportation,
      attendanceLength: churchConnection.attendanceLength,
      connectionLevel: churchConnection.connectionLevel,
      followingJesusLength: churchConnection.followingJesusLength,
      servedBefore: churchConnection.servedBefore,
      previousService: churchConnection.previousService,
      passions: parsed.data.passions,
      interests: parsed.data.interests,
      servingFrequency: parsed.data.servingFrequency,
      availability: parsed.data.availability,
      occupation: skills.occupation,
      uniqueSkills: skills.uniqueSkills,
      previousMinistryExperience: skills.previousMinistryExperience,
      leadershipExperience: skills.leadershipExperience,
      missionTripExperience: skills.missionTripExperience,
      lifeExperience: skills.lifeExperience,
      languages: parsed.data.languages ?? null,
      churchDetails: parsed.data.churchDetails ?? null,
      skillsDetails: parsed.data.skillsDetails ?? null,
      lifeExperiences: parsed.data.lifeExperiences ?? null,
      availabilityDetails: parsed.data.availabilityDetails ?? null,
      ministryPreferences: parsed.data.ministryPreferences ?? null,
      apest: parsed.data.assessmentSections?.apest ?? null,
      spiritualGifts: parsed.data.assessmentSections?.spiritualGifts ?? null,
      personalityStrengths: parsed.data.assessmentSections?.personalityStrengths ?? null,
      naturalStrengths: parsed.data.assessmentSections?.naturalStrengths ?? null,
      spiritualHealth: parsed.data.assessmentSections?.spiritualHealth ?? null,
    })
    .returning();

  if (!created) throw new Error("Unable to create Ministry Profile");
  res.status(201).json(CreateProfileResponse.parse(profileResponse(created)));
});

router.get("/profiles/:id", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const params = GetProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const church = await getOrCreateChurch(userId);
  const [profile] = await db
    .select()
    .from(ministryProfilesTable)
    .where(
      and(
        eq(ministryProfilesTable.id, params.data.id),
        eq(ministryProfilesTable.churchId, church.id),
      ),
    )
    .limit(1);

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(GetProfileResponse.parse(profileResponse(profile)));
});

export default router;
