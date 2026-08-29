import { Router, type IRouter } from "express";
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
} from "@workspace/api-zod";
import { churchesTable, db, ministryProfilesTable } from "@workspace/db";
import { requireUserId } from "../lib/auth";
import { getOrCreateChurch } from "../lib/churches";
import { profileListItem, profileResponse } from "../lib/profiles";
import { findVolunteerMatches } from "../lib/volunteer-matching";
import {
  activeSpiritualGifts,
  spiritualGiftsSubmissionError,
} from "../lib/spiritual-gifts";
import {
  assessmentConfiguration,
  filterAssessmentSection,
  hasEnabledSubsections,
} from "../lib/assessment-configuration";

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

  const configuration = assessmentConfiguration(church.assessmentConfiguration);
  if (!configuration) {
    res.status(400).json({
      error: "This church's assessment configuration is invalid. Please contact the church administrator.",
    });
    return;
  }
  const basicInformation = parsed.data.basicInformation;
  if (!basicInformation) {
    res.status(400).json({ error: "First name, last name, and email are required." });
    return;
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
      "APEST responses",
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
    const spiritualGiftsError = spiritualGiftsSubmissionError(spiritualGifts, activeGifts);
    if (spiritualGiftsError) {
      res.status(400).json({ error: spiritualGiftsError });
      return;
    }
  }

  const churchConnection = parsed.data.churchConnection;
  const skills = parsed.data.skills;
  const [created] = await db
    .insert(ministryProfilesTable)
    .values({
      churchId: church.id,
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
    })
    .returning();

  if (!created) throw new Error("Unable to create Ministry Profile");
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
    new Set(parsed.data.availability).size !== parsed.data.availability.length
  ) {
    res.status(400).json({ error: "Availability choices must be unique." });
    return;
  }

  const church = await getOrCreateChurch(userId);
  const profiles = await db
    .select()
    .from(ministryProfilesTable)
    .where(eq(ministryProfilesTable.churchId, church.id))
    .orderBy(desc(ministryProfilesTable.completedAt));

  const matches = await findVolunteerMatches(profiles, parsed.data);
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
