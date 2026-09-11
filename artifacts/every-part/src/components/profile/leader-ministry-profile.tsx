import type { MinistryProfile } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { 
  Section, 
  Value, 
  ObjectValues, 
  Languages, 
  MinistryAssessment, 
  SpiritualGifts, 
  StrengthsAssessment, 
  PersonalityAssessment
} from "../../pages/profile-detail";
import { hasValues } from "@/components/coordinator-ask";

export function LeaderMinistryProfile({
  profile,
  isPrinting,
  sectionEnabled,
  subsectionEnabled
}: {
  profile: MinistryProfile;
  isPrinting: boolean;
  sectionEnabled: (section: string) => boolean;
  subsectionEnabled: (section: string, subsection: string) => boolean;
}) {
  const basic = profile.basicInformation;
  const connection = profile.churchConnection;
  const skills = profile.skills;
  const skillDetails = skills.details && typeof skills.details === "object" && !Array.isArray(skills.details) ? skills.details as Record<string, unknown> : null; 
  const hasConversationSkills = Boolean(skillDetails && ("context" in skillDetails || "training" in skillDetails || "enjoys" in skillDetails));

  return (
    <div className="space-y-8 pb-16 mt-8">
      {sectionEnabled("aboutYou") && (
        <Section title="About You">
          <div className="space-y-6">
            {subsectionEnabled("aboutYou", "personalInformation") && (
              <div>
                <h3 className="font-medium mb-2">Personal information</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Value label="Age" value={profile.age} />
                  <Value label="Preferred contact" value={basic.preferredContact} />
                  <Value label="Family situation" value={basic.familySituation} />
                  <Value label="Transportation" value={basic.transportation} />
                </div>
                <div className="mt-3">
                  <Languages value={basic.languages} />
                </div>
              </div>
            )}
            {subsectionEnabled("aboutYou", "skillsExperience") && (
              <div>
                <h3 className="font-medium mb-2">{hasConversationSkills ? "What You Bring" : "Skills & experience"}</h3>
                {hasConversationSkills ? (
                  <div className="grid gap-3">
                    <Value label="Work, study, or current life context" value={skillDetails?.context ?? skills.occupation} />
                    <Value label="Training or certifications" value={skillDetails?.training} />
                    <Value label="What they enjoy doing with or for other people" value={skillDetails?.enjoys ?? skills.uniqueSkills} />
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Value label="Occupation" value={skills.occupation} />
                    <Value label="Unique skill" value={skills.uniqueSkills} />
                    <Value label="Previous ministry experience" value={skills.previousMinistryExperience} />
                    <Value label="Leadership experience" value={skills.leadershipExperience} />
                    <Value label="Mission trip experience" value={skills.missionTripExperience} />
                  </div>
                )}
              </div>
            )}
            {!isPrinting && subsectionEnabled("aboutYou", "lifeExperiences") && hasValues(profile.lifeExperiences) && (
              <div className="no-print">
                <h3 className="font-medium mb-2">Experiences that have shaped them</h3>
                <p className="text-sm text-muted-foreground mb-3">Shared voluntarily; please handle with care and discretion.</p>
                <ObjectValues value={profile.lifeExperiences} />
              </div>
            )}
          </div>
        </Section>
      )}

      {sectionEnabled("apest") && (
        <Section title="How You Minister">
          <p className="mb-3 text-sm text-muted-foreground">Member self-reflection, not a diagnosis, score, or placement recommendation.</p>
          <MinistryAssessment value={profile.assessmentSections.apest} isEnabled={subsection => subsectionEnabled("apest", subsection)} />
        </Section>
      )}

      {!isPrinting && sectionEnabled("spiritualGifts") && (
        <details className="no-print rounded-2xl border bg-card p-4">
          <summary className="cursor-pointer font-serif text-2xl font-medium">Full gifts reflections</summary>
          <p className="text-sm text-muted-foreground mt-3 mb-3">Member self-reflection, not a diagnosis or placement recommendation.</p>
          <SpiritualGifts value={profile.assessmentSections.spiritualGifts} />
        </details>
      )}

      {sectionEnabled("passionsInterests") && (
        <Section title="Who and where you are drawn toward (Passions)">
          <div className="space-y-5">
            {subsectionEnabled("passionsInterests", "passions") && (
              <div>
                <h3 className="font-medium mb-2">Passions</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.passions.length ? profile.passions.map(x => <Badge key={x}>{x}</Badge>) : <span className="italic text-muted-foreground">No passions shared.</span>}
                </div>
              </div>
            )}
            {subsectionEnabled("passionsInterests", "ministryInterests") && (
              <div>
                <h3 className="font-medium mb-2">Ministry interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.length ? profile.interests.map(x => <Badge key={x} variant="outline">{x}</Badge>) : <span className="italic text-muted-foreground">No interests shared.</span>}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {sectionEnabled("naturalStrengths") && (
        <Section title="What you naturally do well (Strengths)">
          <p className="text-sm text-muted-foreground mb-3">Strengths-based self-reflection for conversation, not a branded test, diagnosis, or automatic placement recommendation.</p>
          <StrengthsAssessment value={profile.assessmentSections.naturalStrengths} isEnabled={subsection => subsectionEnabled("naturalStrengths", subsection)} />
        </Section>
      )}

      {sectionEnabled("personalityStrengths") && (
        <Section title="Personality">
          <div className="space-y-5">
            <div>
              <p className="text-sm text-muted-foreground mb-3">Original ministry-focused self-reflection, not a rigid personality type, diagnosis, or statement about calling.</p>
              <PersonalityAssessment value={profile.assessmentSections.personalityStrengths} isEnabled={subsection => subsectionEnabled("personalityStrengths", subsection)} />
            </div>
            {subsectionEnabled("personalityStrengths", "ministryPreferences") && hasValues(profile.ministryPreferences) && (
              <div>
                <h3 className="font-medium mb-2">Ministry preferences & environment</h3>
                <ObjectValues value={profile.ministryPreferences} />
              </div>
            )}
          </div>
        </Section>
      )}

      {sectionEnabled("spiritualHealth") && hasValues(profile.assessmentSections.spiritualHealth) && (
        <Section title="How you are doing (Spiritual Health)">
          <p className="text-sm text-muted-foreground mb-3">Pastoral self-reflection only, never a pass/fail measure.</p>
          <ObjectValues value={profile.assessmentSections.spiritualHealth} />
        </Section>
      )}

      {sectionEnabled("connectionAvailability") && (
        <Section title="How you are connected">
          <div className="space-y-5">
            {subsectionEnabled("connectionAvailability", "churchConnection") && (
              <div>
                <h3 className="font-medium mb-2">Church connection</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Value label="Attending" value={connection.attendanceLength} />
                  <Value label="Following Jesus" value={connection.followingJesusLength} />
                  <Value label="Connection level (self-reported)" value={connection.connectionLevel} />
                  <Value label="Served here before" value={connection.servedBefore ? "Yes" : "No"} />
                  <Value label="Prior service" value={connection.previousService} />
                </div>
                <div className="mt-3">
                  <ObjectValues value={connection.details} />
                </div>
              </div>
            )}
            {subsectionEnabled("connectionAvailability", "availability") && (
              <div>
                <h3 className="font-medium mb-2">Current availability and serving</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Value label="Frequency" value={profile.servingFrequency} />
                  <Value label="Times" value={profile.availability.join(", ")} />
                </div>
                <div className="mt-3">
                  <ObjectValues value={profile.availabilityDetails} />
                </div>
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}