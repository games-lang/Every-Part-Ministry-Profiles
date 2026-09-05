import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { and, desc, eq } from "drizzle-orm";
import {
  CreateProfileBody,
  CreateProfileResponse,
  GetProfileParams,
  GetProfileResponse,
  FindVolunteerMatchesBody,
  FindVolunteerMatchesResponse,
  ListProfilesQueryParams,
  ListProfilesResponse,
  UpdateProfileTeamBody,
  UpdateProfileTeamResponse,
} from "@workspace/api-zod";
import {
  churchesTable,
  churchAdminsTable,
  db,
  ministryProfilesTable,
  ministryPeopleTable,
  ministryTeamsTable,
} from "@workspace/db";
import { requireUserId } from "../lib/auth";
import { getOrCreateChurch } from "../lib/churches";
import { profileListItem, profileResponse } from "../lib/profiles";
import {
  findVolunteerMatches,
  hasDuplicateAvailabilityChoices,
} from "../lib/volunteer-matching";
import {
  adultProfilesOnly,
  pathwayForAge,
  pathwayOverrideRequired,
} from "../lib/youth-profiles";
import {
  activeSpiritualGifts,
  spiritualGiftsSubmissionError,
} from "../lib/spiritual-gifts";
import {
  assessmentConfiguration,
  filterAssessmentSection,
  hasEnabledSubsections,
  ministrySubmissionError,
} from "../lib/assessment-configuration";
import { ministryCustomization } from "../lib/ministry-customization";
import {
  ensureJourneyForProfile,
  getOrCreateJourney,
  updateJourneyAfterProfile,
} from "../lib/ministry-journeys";
import {
  assertProfileCapacity,
  ProfileLimitReachedError,
} from "../lib/profile-limits";
import {
  AiCreditsExceededError,
  reserveAiCredits,
} from "../lib/ai-credits";
import { ObjectNotFoundError, ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const storage = new ObjectStorageService();

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
  const recommendedProfileType = pathwayForAge(parsed.data.age);
  let profileTypeOverridden = false;
  if (pathwayOverrideRequired(parsed.data.profileType, recommendedProfileType)) {
    const auth = getAuth(req);
    const userId =
      (auth.sessionClaims?.userId as string | undefined) ?? auth.userId;
    if (!userId) {
      res.status(400).json({ error: "This age belongs on a different pathway." });
      return;
    }
    const [membership] = await db
      .select({ id: churchAdminsTable.id })
      .from(churchAdminsTable)
      .where(
        and(
          eq(churchAdminsTable.churchId, church.id),
          eq(churchAdminsTable.clerkUserId, userId),
        ),
      )
      .limit(1);
    if (!membership) {
      res.status(400).json({ error: "This age belongs on a different pathway." });
      return;
    }
    profileTypeOverridden = true;
  }

  const configuration = assessmentConfiguration(church.assessmentConfiguration);
  if (!configuration) {
    res.status(400).json({
      error: "This church's assessment configuration is invalid. Please contact the church administrator.",
    });
    return;
  }
  const customization = ministryCustomization(church.ministryCustomization);
  if (!customization) {
    res.status(400).json({
      error:
        "This church's ministry customization is invalid. Please contact the church administrator.",
    });
    return;
  }
  const basicInformation = parsed.data.basicInformation;
  if (!basicInformation) {
    res.status(400).json({ error: "First name, last name, and email are required." });
    return;
  }
  if (parsed.data.profilePhotoPath) {
    try {
      await storage.validateProfilePhoto(parsed.data.profilePhotoPath, church.id);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error
          ? `Profile photo is invalid: ${error.message}`
          : "Profile photo is invalid.",
      });
      return;
    }
  }
  const requireGroup = (condition: boolean, value: unknown, label: string) => {
    if (condition && value == null) {
      res.status(400).json({ error: `${label} is required by this church's assessment configuration.` });
      return false;
    }
    return true;
  };
  const personalInformationEnabled =
    configuration.sections.aboutYou &&
    configuration.subsections["aboutYou.personalInformation"];
  const skillsEnabled =
    configuration.sections.aboutYou &&
    configuration.subsections["aboutYou.skillsExperience"];
  const lifeExperiencesEnabled =
    configuration.sections.aboutYou &&
    configuration.subsections["aboutYou.lifeExperiences"];
  const churchConnectionEnabled =
    configuration.sections.connectionAvailability &&
    configuration.subsections["connectionAvailability.churchConnection"];
  const availabilityEnabled =
    configuration.sections.connectionAvailability &&
    configuration.subsections["connectionAvailability.availability"];
  const passionsEnabled =
    configuration.sections.passionsInterests &&
    configuration.subsections["passionsInterests.passions"];
  const interestsEnabled =
    configuration.sections.passionsInterests &&
    configuration.subsections["passionsInterests.ministryInterests"];
  if (
    !requireGroup(
      personalInformationEnabled,
      basicInformation.ageRange != null &&
        basicInformation.preferredContact != null &&
        basicInformation.familySituation != null &&
        basicInformation.transportation != null,
      "Personal information",
    ) ||
    !requireGroup(skillsEnabled, parsed.data.skills, "Skills and experience") ||
    !requireGroup(
      churchConnectionEnabled,
      parsed.data.churchConnection?.attendanceLength != null &&
        parsed.data.churchConnection.connectionLevel != null &&
        parsed.data.churchConnection.followingJesusLength != null &&
        parsed.data.churchConnection.servedBefore != null &&
        Object.hasOwn(parsed.data.churchConnection, "previousService"),
      "Church connection",
    ) ||
    !requireGroup(passionsEnabled, parsed.data.passions?.length, "Passions") ||
    !requireGroup(interestsEnabled, parsed.data.interests?.length, "Ministry interests") ||
    !requireGroup(availabilityEnabled, parsed.data.availability?.length, "Availability") ||
    !requireGroup(
      configuration.sections.apest && hasEnabledSubsections("apest", configuration),
      parsed.data.assessmentSections?.apest,
      "How you minister responses",
    ) ||
    !requireGroup(
      configuration.sections.naturalStrengths && hasEnabledSubsections("naturalStrengths", configuration),
      parsed.data.assessmentSections?.naturalStrengths,
      "Natural strengths responses",
    ) ||
    !requireGroup(
      configuration.sections.personalityStrengths && hasEnabledSubsections("personalityStrengths", configuration),
      parsed.data.assessmentSections?.personalityStrengths,
      "Personality responses",
    ) ||
    !requireGroup(
      configuration.sections.spiritualHealth && hasEnabledSubsections("spiritualHealth", configuration),
      parsed.data.assessmentSections?.spiritualHealth,
      "Spiritual health responses",
    )
  ) return;
  if (
    configuration.sections.apest &&
    hasEnabledSubsections("apest", configuration)
  ) {
    const ministryError = ministrySubmissionError(
      parsed.data.assessmentSections?.apest,
      configuration,
    );
    if (ministryError) {
      res.status(400).json({ error: ministryError });
      return;
    }
  }
  if (configuration.sections.spiritualGifts) {
    const activeGifts = activeSpiritualGifts(church.enabledSpiritualGifts);
    if (!activeGifts) {
      res.status(400).json({
        error: "This church's spiritual gifts configuration is invalid. Please contact the church administrator.",
      });
      return;
    }
    const spiritualGifts = parsed.data.assessmentSections?.spiritualGifts;
    if (!spiritualGifts) {
      res.status(400).json({ error: "Spiritual gifts responses are required." });
      return;
    }
    const spiritualGiftsError = spiritualGiftsSubmissionError(
      spiritualGifts,
      activeGifts,
      configuration.spiritualGiftQuestionCount,
    );
    if (spiritualGiftsError) {
      res.status(400).json({ error: spiritualGiftsError });
      return;
    }
  }

  let journey;
  try {
    journey = await getOrCreateJourney(
      church.id,
      parsed.data.journeyToken ?? undefined,
      recommendedProfileType,
    );
  } catch {
    res.status(400).json({ error: "The journey link is invalid or no longer available." });
    return;
  }
  if (parsed.data.inviteToken) {
    const [invite] = await db
      .select()
      .from(ministryPeopleTable)
      .where(
        and(
          eq(ministryPeopleTable.inviteToken, parsed.data.inviteToken),
          eq(ministryPeopleTable.churchId, church.id),
          eq(ministryPeopleTable.inviteStatus, "pending"),
          eq(ministryPeopleTable.isArchived, false),
        ),
      )
      .limit(1);
    if (!invite || invite.inviteExpiresAt.getTime() <= Date.now()) {
      res.status(400).json({ error: "This Ministry Profile invitation is invalid or expired." });
      return;
    }
  }
  const churchConnection = parsed.data.churchConnection;
  const skills = parsed.data.skills;
  let created;
  try {
    created = await db.transaction(async (tx) => {
      await assertProfileCapacity(tx, church.id);
      const [profile] = await tx
        .insert(ministryProfilesTable)
        .values({
          churchId: church.id,
          journeyId: journey.id,
          personKey: journey.accessToken,
          profileType: "adult",
          recommendedProfileType,
          profileTypeOverridden,
          age: parsed.data.age,
          // OpenAPI's date validator returns a Date; database date columns retain
          // a calendar-day string to avoid timezone shifts.
          birthdate: parsed.data.birthdate
            ? parsed.data.birthdate.toISOString().slice(0, 10)
            : null,
          firstName: basicInformation.firstName,
          lastName: basicInformation.lastName,
          email: basicInformation.email,
          phone: basicInformation.phone ?? null,
          ageRange: personalInformationEnabled ? basicInformation.ageRange ?? null : null,
          preferredContact: personalInformationEnabled ? basicInformation.preferredContact ?? null : null,
          familySituation: personalInformationEnabled ? basicInformation.familySituation ?? null : null,
          transportation: personalInformationEnabled ? basicInformation.transportation ?? null : null,
          attendanceLength: churchConnectionEnabled ? churchConnection?.attendanceLength ?? null : null,
          connectionLevel: churchConnectionEnabled ? churchConnection?.connectionLevel ?? null : null,
          followingJesusLength: churchConnectionEnabled ? churchConnection?.followingJesusLength ?? null : null,
          servedBefore: churchConnectionEnabled ? churchConnection?.servedBefore ?? null : null,
          previousService: churchConnectionEnabled ? churchConnection?.previousService ?? null : null,
          passions: passionsEnabled ? parsed.data.passions ?? [] : [],
          interests: interestsEnabled ? parsed.data.interests ?? [] : [],
          servingFrequency: availabilityEnabled ? parsed.data.servingFrequency ?? null : null,
          availability: availabilityEnabled ? parsed.data.availability ?? [] : [],
          occupation: skillsEnabled ? skills?.occupation ?? null : null,
          uniqueSkills: skillsEnabled ? skills?.uniqueSkills ?? null : null,
          previousMinistryExperience: skillsEnabled ? skills?.previousMinistryExperience ?? null : null,
          leadershipExperience: skillsEnabled ? skills?.leadershipExperience ?? null : null,
          missionTripExperience: skillsEnabled ? skills?.missionTripExperience ?? null : null,
          lifeExperience: skillsEnabled ? skills?.lifeExperience ?? null : null,
          languages: personalInformationEnabled ? parsed.data.languages ?? null : null,
          churchDetails: churchConnectionEnabled ? parsed.data.churchDetails ?? null : null,
          skillsDetails: skillsEnabled ? parsed.data.skillsDetails ?? null : null,
          lifeExperiences: lifeExperiencesEnabled ? parsed.data.lifeExperiences ?? null : null,
          availabilityDetails: availabilityEnabled ? parsed.data.availabilityDetails ?? null : null,
          ministryPreferences: configuration.sections.personalityStrengths && configuration.subsections["personalityStrengths.ministryPreferences"] ? parsed.data.ministryPreferences ?? null : null,
          apest: filterAssessmentSection("apest", parsed.data.assessmentSections?.apest, configuration),
          spiritualGifts: filterAssessmentSection("spiritualGifts", parsed.data.assessmentSections?.spiritualGifts, configuration),
          personalityStrengths: filterAssessmentSection("personalityStrengths", parsed.data.assessmentSections?.personalityStrengths, configuration),
          naturalStrengths: filterAssessmentSection("naturalStrengths", parsed.data.assessmentSections?.naturalStrengths, configuration),
          spiritualHealth: filterAssessmentSection("spiritualHealth", parsed.data.assessmentSections?.spiritualHealth, configuration),
          assessmentConfigurationSnapshot: configuration,
          ministryCustomizationSnapshot: customization,
          profilePhotoPath: parsed.data.profilePhotoPath ?? null,
        })
        .returning();

      if (!profile) throw new Error("Unable to create Ministry Profile");
      if (parsed.data.inviteToken) {
        const [linkedPerson] = await tx
          .update(ministryPeopleTable)
          .set({
            profileId: profile.id,
            inviteStatus: "completed",
          })
          .where(
            and(
              eq(ministryPeopleTable.inviteToken, parsed.data.inviteToken),
              eq(ministryPeopleTable.churchId, church.id),
              eq(ministryPeopleTable.inviteStatus, "pending"),
            ),
          )
          .returning({ id: ministryPeopleTable.id });
        if (!linkedPerson) {
          throw new Error("MINISTRY_PROFILE_INVITE_ALREADY_USED");
        }
      }
      return profile;
    });
  } catch (error) {
    if (error instanceof ProfileLimitReachedError) {
      res.status(403).json({ error: error.message });
      return;
    }
    if (
      error instanceof Error &&
      error.message === "MINISTRY_PROFILE_INVITE_ALREADY_USED"
    ) {
      res.status(400).json({ error: "This Ministry Profile invitation is invalid or expired." });
      return;
    }
    throw error;
  }
  await updateJourneyAfterProfile(created.journeyId!, created.profileType, created.completedAt);
  res.status(201).json(CreateProfileResponse.parse(profileResponse(created)));
});

router.post("/profiles/matches", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = FindVolunteerMatchesBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid volunteer matching criteria");
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (
    parsed.data.availability &&
    hasDuplicateAvailabilityChoices(parsed.data.availability)
  ) {
    res.status(400).json({ error: "Availability choices must be unique." });
    return;
  }

  const church = await getOrCreateChurch(userId);
  try {
    await reserveAiCredits(church.id);
  } catch (error) {
    if (error instanceof AiCreditsExceededError) {
      res.status(403).json({ error: error.message });
      return;
    }
    throw error;
  }
  const profiles = await db
    .select()
    .from(ministryProfilesTable)
    .where(and(eq(ministryProfilesTable.churchId, church.id), eq(ministryProfilesTable.profileType, "adult")))
    .orderBy(desc(ministryProfilesTable.completedAt));

  const matches = await findVolunteerMatches(
    adultProfilesOnly(profiles),
    parsed.data,
    church.id,
  );
  req.log.info(
    {
      candidateCount: profiles.length,
      resultCount: matches.candidates.length,
      usedAi: matches.usedAi,
    },
    "Volunteer matching completed",
  );
  res.json(FindVolunteerMatchesResponse.parse(matches));
});

router.patch("/profiles/:id/team", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const params = GetProfileParams.safeParse(req.params);
  const parsed = UpdateProfileTeamBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const church = await getOrCreateChurch(userId);
  const result = await db.transaction(async (tx) => {
    const [profile] = await tx
      .select()
      .from(ministryProfilesTable)
      .where(
        and(
          eq(ministryProfilesTable.id, params.data.id),
          eq(ministryProfilesTable.churchId, church.id),
        ),
      )
      .for("update")
      .limit(1);
    if (!profile) return { error: "Profile not found", status: 404 } as const;
    if (profile.profileType !== "adult") {
      return { error: "Youth profiles cannot be assigned to adult ministry teams.", status: 400 } as const;
    }

    let teamName: string | null = null;
    if (parsed.data.teamId !== null) {
      const [team] = await tx
        .select()
        .from(ministryTeamsTable)
        .where(
          and(
            eq(ministryTeamsTable.id, parsed.data.teamId),
            eq(ministryTeamsTable.churchId, church.id),
          ),
        )
        .for("update")
        .limit(1);
      if (!team) return { error: "Team not found", status: 404 } as const;
      if (team.isArchived) {
        return {
          error: "Archived teams cannot receive new profile assignments.",
          status: 400,
        } as const;
      }
      teamName = team.name;
    }

    const [updated] = await tx
      .update(ministryProfilesTable)
      .set({ teamId: parsed.data.teamId })
      .where(
        and(
          eq(ministryProfilesTable.id, profile.id),
          eq(ministryProfilesTable.churchId, church.id),
        ),
      )
      .returning();
    if (!updated) return { error: "Profile not found", status: 404 } as const;

    return { updated, teamName } as const;
  });
  if ("error" in result && typeof result.status === "number") {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.json(
    UpdateProfileTeamResponse.parse({
      profileId: result.updated.id,
      teamId: parsed.data.teamId,
      teamName: result.teamName,
    }),
  );
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

  if (!profile.journeyId) {
    const journey = await ensureJourneyForProfile(profile);
    profile.journeyId = journey.id;
    profile.personKey = journey.accessToken;
  }
  res.json(GetProfileResponse.parse(profileResponse(profile)));
});

router.get("/profiles/:id/photo", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const params = GetProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ error: "Profile photo not found" });
    return;
  }
  const church = await getOrCreateChurch(userId);
  const [profile] = await db
    .select({
      profilePhotoPath: ministryProfilesTable.profilePhotoPath,
      churchId: ministryProfilesTable.churchId,
    })
    .from(ministryProfilesTable)
    .where(and(
      eq(ministryProfilesTable.id, params.data.id),
      eq(ministryProfilesTable.churchId, church.id),
    ))
    .limit(1);
  if (!profile?.profilePhotoPath) {
    res.status(404).json({ error: "Profile photo not found" });
    return;
  }
  try {
    const { file, contentType } = await storage.validateProfilePhoto(
      profile.profilePhotoPath,
      church.id,
    );
    const response = await storage.downloadObject(file, contentType);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.setHeader("Cache-Control", "private, max-age=300");
    if (!response.body) {
      res.end();
      return;
    }
    const reader = response.body.getReader();
    const write = async (): Promise<void> => {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        return;
      }
      if (!res.write(Buffer.from(value))) {
        await new Promise<void>((resolve) => res.once("drain", resolve));
      }
      await write();
    };
    await write();
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Profile photo not found" });
      return;
    }
    req.log.error({ err: error, profileId: params.data.id }, "Unable to serve profile photo");
    res.status(404).json({ error: "Profile photo not found" });
  }
});

export default router;
