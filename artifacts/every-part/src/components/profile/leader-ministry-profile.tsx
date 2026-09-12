import { useMemo } from "react";
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
import { getLeaderSynthesis } from "../../lib/leader-derivation";
import { PastorNotesEditor } from "./pastor-notes-editor";
import { LeaderFitSection } from "./leader-fit-section";
import {
  AlertCircle,
  BookOpen,
  ClipboardList,
  Ear,
  Eye,
  Footprints,
  Hand,
  Heart,
  Layers,
  MessageSquare,
  Mic,
  Shield,
  Users,
} from "lucide-react";
import { format } from "date-fns";

const orientationPictures = {
  Apostle: { part: "Feet", icon: Footprints },
  Prophet: { part: "Eyes", icon: Eye },
  Evangelist: { part: "Mouth", icon: MessageSquare },
  Shepherd: { part: "Heart", icon: Heart },
  Teacher: { part: "Mind", icon: BookOpen },
} as const;

const tendencyPictures = {
  Hands: { name: "The Doer", icon: Hand },
  Ears: { name: "The Listener", icon: Ear },
  Shoulders: { name: "The Supporter", icon: Shield },
  Voice: { name: "The Communicator", icon: Mic },
  Arms: { name: "The Connector", icon: Users },
  Backbone: { name: "The Organizer", icon: Layers },
} as const;

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

  const synthesis = useMemo(
    () => getLeaderSynthesis(profile, sectionEnabled, subsectionEnabled),
    [profile, sectionEnabled, subsectionEnabled]
  );

  const { snapshot, ministryFit, thingsWorthDiscussing, conversationQuestions } = synthesis;
  const OrientationIcon = snapshot.apestResult
    ? orientationPictures[snapshot.apestResult.label as keyof typeof orientationPictures]?.icon
    : null;
  const orientationPart = snapshot.apestResult
    ? orientationPictures[snapshot.apestResult.label as keyof typeof orientationPictures]?.part
    : null;
  const TendencyIcon = snapshot.ministryTendency
    ? tendencyPictures[snapshot.ministryTendency.key as keyof typeof tendencyPictures]?.icon
    : null;
  const tendencyName = snapshot.ministryTendency
    ? tendencyPictures[snapshot.ministryTendency.key as keyof typeof tendencyPictures]?.name
    : null;
  const secondaryTendency = snapshot.ministryTendency?.secondaryKey
    ? tendencyPictures[
        snapshot.ministryTendency
          .secondaryKey as keyof typeof tendencyPictures
      ]
    : null;

  return (
    <div className="space-y-12 pb-16 mt-8">
      {/* 1. SNAPSHOT */}
      <section className="space-y-4">
        <h2 className="font-serif text-3xl font-medium tracking-[-.025em]">Leader Snapshot</h2>
        <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 pb-6 border-b border-border/60">
            <div>
              <h3 className="text-2xl font-medium">{snapshot.name}</h3>
              <p className="text-muted-foreground">
                {snapshot.age ? `${snapshot.age} • ` : ""}
                {snapshot.congregation ? `${snapshot.congregation} • ` : ""}
                Completed {snapshot.completionDate ? format(new Date(snapshot.completionDate), "MMM d, yyyy") : "Recently"}
              </p>
            </div>
            {snapshot.languages && (
              <div className="text-sm">
                <span className="font-medium text-muted-foreground uppercase tracking-widest text-xs">Languages</span>
                <div className="mt-1">
                  <Languages value={snapshot.languages} />
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-primary/5 p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Ministry Orientation</div>
              {snapshot.apestResult ? (
                <div className="flex items-center gap-3">
                  {OrientationIcon && <OrientationIcon className="h-7 w-7 text-primary" aria-hidden="true" />}
                  <div>
                    <div className="font-medium">{orientationPart} — {snapshot.apestResult.label}</div>
                    <p className="text-xs text-muted-foreground">A contribution orientation, not a fixed identity.</p>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground italic text-sm">Not determined</div>
              )}
            </div>
            <div className="rounded-xl bg-secondary/10 p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Ministry Tendency</div>
              {snapshot.ministryTendency ? (
                <div className="flex items-center gap-3">
                  {TendencyIcon && <TendencyIcon className="h-7 w-7 text-primary" aria-hidden="true" />}
                  <div>
                    <div className="font-medium">{snapshot.ministryTendency.key} — {tendencyName}</div>
                    <p className="text-xs text-muted-foreground">Tends to minister like this part of the Body.</p>
                    {secondaryTendency && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Close secondary: {snapshot.ministryTendency.secondaryKey} — {secondaryTendency.name}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground italic text-sm">Not determined</div>
              )}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Top Spiritual Gifts</div>
              {snapshot.topGifts.length > 0 ? (
                <div className="font-medium">{snapshot.topGifts.join(", ")}</div>
              ) : (
                <div className="text-muted-foreground italic text-sm">None shared</div>
              )}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Passions & Themes</div>
              {snapshot.themes.length > 0 ? (
                <div className="font-medium">{snapshot.themes.map(t => t.name).join(", ")}</div>
              ) : (
                <div className="text-muted-foreground italic text-sm">None shared</div>
              )}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Availability</div>
              <div className="font-medium">{snapshot.availability || <span className="text-muted-foreground italic font-normal text-sm">Not specified</span>}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Previous Experience</div>
              <div className="font-medium">{snapshot.experience || <span className="text-muted-foreground italic font-normal text-sm">Not specified</span>}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PRIVATE PASTOR NOTES (Not visible in print) */}
      {!isPrinting && (
        <section className="no-print">
          <PastorNotesEditor profileId={profile.id} />
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* 3. MINISTRY FIT */}
        <LeaderFitSection ministryFit={ministryFit} />

        {/* 4. THINGS WORTH DISCUSSING & CONVERSATION QUESTIONS */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="font-serif text-2xl font-medium flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
              Things Worth Discussing
            </h3>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground mb-4">
                Observations drawn from the profile. Never use these to diagnose or judge.
              </p>
              {thingsWorthDiscussing.length > 0 ? (
                <ul className="space-y-4">
                  {thingsWorthDiscussing.map((item, idx) => (
                    <li key={idx} className="border-l-2 border-muted pl-4 py-1">
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.reason}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center p-6 bg-muted/20 rounded-xl border border-border/50 text-muted-foreground text-sm italic">
                  No specific caution areas identified in this profile.
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-serif text-2xl font-medium flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary/70" />
              Conversation Questions
            </h3>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <ul className="space-y-3">
                {conversationQuestions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-primary/50 font-serif font-bold italic">{idx + 1}.</span>
                    <span className="text-sm leading-relaxed">{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>

      {/* 5. ORIGINAL PROFILE DATA */}
      <div className="pt-8 border-t border-border/50">
        <h2 className="font-serif text-3xl font-medium mb-6 flex items-center gap-3">
          <ClipboardList className="h-7 w-7 text-muted-foreground" />
          Full Assessment Details
        </h2>
        <div className="space-y-8">
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
      </div>
    </div>
  );
}