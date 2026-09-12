import { useMemo } from "react";
import type { MinistryProfile } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Value, ObjectValues, Languages } from "../../pages/profile-detail";
import { hasValues } from "@/components/coordinator-ask";
import { getLeaderSynthesis } from "../../lib/leader-derivation";
import { PastorNotesEditor } from "./pastor-notes-editor";
import { LeaderFitSection } from "./leader-fit-section";
import { PortraitChapter } from "./portrait-chapter";
import { buildMinistryPortrait } from "../../lib/ministry-portrait";
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
  Star,
  Lightbulb,
  Compass,
  MapPin,
  ShieldAlert
} from "lucide-react";
import { format } from "date-fns";

const APEST_BODY_PARTS: Record<string, { part: string; description: string; icon: any }> = {
  Apostle: { part: "Feet", description: "You naturally help the Body move forward, cross boundaries, and explore new opportunities.", icon: Footprints },
  Prophet: { part: "Eyes", description: "You naturally help the Body notice what others may miss and see situations through the lens of God’s truth.", icon: Eye },
  Evangelist: { part: "Mouth", description: "You naturally help the Body communicate good news and invite others toward Jesus.", icon: MessageSquare },
  Shepherd: { part: "Heart", description: "You naturally help the Body stay connected, cared for, and healthy.", icon: Heart },
  Teacher: { part: "Mind", description: "You naturally help the Body understand truth, gain wisdom, and grow in understanding.", icon: BookOpen },
};

const TENDENCIES: Record<string, { name: string; description: string; explanation: string; strengths: string[]; blindSpots: string[]; icon: any }> = {
  Hands: { name: "The Doer", description: "You tend to minister like the Hands of the Body.", explanation: "You notice what needs to be done and tend to jump in.", strengths: ["Practical", "Helpful", "Dependable", "Action-oriented", "Service-minded"], blindSpots: ["May begin doing before understanding the deeper need or may carry too much personally."], icon: Hand },
  Ears: { name: "The Listener", description: "You tend to minister like the Ears of the Body.", explanation: "You tend to slow down, listen, understand, and make space for people.", strengths: ["Patient", "Relational", "Empathetic", "Attentive", "Good one-on-one"], blindSpots: ["May hesitate to speak or act when action is needed."], icon: Ear },
  Shoulders: { name: "The Supporter", description: "You tend to minister like the Shoulders of the Body.", explanation: "You naturally help carry responsibility and strengthen other people.", strengths: ["Loyal", "Steady", "Supportive", "Dependable", "Team-oriented"], blindSpots: ["May carry responsibilities that should belong to someone else."], icon: Shield },
  Voice: { name: "The Communicator", description: "You tend to minister like the Voice of the Body.", explanation: "You naturally communicate, encourage, explain, inspire, or influence.", strengths: ["Verbal", "Encouraging", "Expressive", "Comfortable communicating", "Able to rally others"], blindSpots: ["May speak before listening enough."], icon: Mic },
  Arms: { name: "The Connector", description: "You tend to minister like the Arms of the Body.", explanation: "You tend to bring people together and help people feel welcomed and connected.", strengths: ["Hospitality", "Relationship-building", "Inclusion", "Networking", "Team connection"], blindSpots: ["May prioritize harmony or connection when a difficult conversation is necessary."], icon: Users },
  Backbone: { name: "The Organizer", description: "You tend to minister like the Backbone of the Body.", explanation: "You naturally bring structure, order, planning, and stability.", strengths: ["Administration", "Planning", "Follow-through", "Organization", "Systems thinking"], blindSpots: ["May become frustrated with ambiguity, spontaneity, or people who work differently."], icon: Layers }
};

const spiritualGiftMeanings: Record<string, string> = {
  "Administration":"organizing people, resources, and systems effectively", "Apostleship":"pioneering, starting, expanding, and establishing new ministries or works", "Discernment of Spirits":"recognizing what is from God, human influence, or spiritual deception", "Evangelism":"communicating the gospel and helping people respond to Jesus", "Exhortation / Encouragement":"strengthening, motivating, comforting, and challenging others", "Faith":"unusual confidence in God’s power, promises, and provision", "Giving":"generously and joyfully sharing resources to advance God’s work and meet needs", "Healing":"being used by God as an instrument of physical, emotional, or spiritual healing", "Helps / Service":"meeting practical needs and supporting others so ministry can happen", "Hospitality":"welcoming people and creating environments where others feel received and cared for", "Interpretation of Tongues":"interpreting a message spoken in tongues", "Knowledge":"understanding and communicating spiritual truth or insight", "Leadership":"providing direction, motivating others, and helping a group move toward God-given goals", "Mercy":"compassionately caring for people who are hurting, struggling, marginalized, or in need", "Miracles":"being used by God in extraordinary demonstrations of His power", "Pastoring / Shepherding":"caring for, protecting, guiding, and nurturing people spiritually", "Prophecy":"communicating a message believed to be prompted by God for strengthening, correction, encouragement, or direction", "Teaching":"explaining and applying biblical truth so others understand and grow", "Tongues":"speaking in a language or spiritual utterance given through the Holy Spirit", "Wisdom":"applying spiritual truth appropriately to real situations", "Craftsmanship":"using artistic or practical skill for God’s purposes", "Intercession":"persistent, focused prayer for others", "Missionary / Cross-Cultural Ministry":"effectively ministering across cultures and communities", "Music / Worship":"using musical ability to lead and encourage worship", "Celibacy":"a particular grace for remaining unmarried for undivided devotion to ministry", "Voluntary Poverty":"willingly living with less in order to serve God and others",
};

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
  const skills = profile.skills;
  const skillDetails = skills.details && typeof skills.details === "object" && !Array.isArray(skills.details) ? skills.details as Record<string, unknown> : null; 
  const hasConversationSkills = Boolean(skillDetails && ("context" in skillDetails || "training" in skillDetails || "enjoys" in skillDetails));

  const synthesis = useMemo(
    () => getLeaderSynthesis(profile, sectionEnabled, subsectionEnabled),
    [profile, sectionEnabled, subsectionEnabled]
  );

  const { participantSynthesis, snapshot, ministryFit, thingsWorthDiscussing, conversationQuestions } = synthesis;
  const portrait = buildMinistryPortrait(
    profile,
    participantSynthesis,
    sectionEnabled,
    subsectionEnabled,
    "leader",
  );
  const spiritualHealth = sectionEnabled("spiritualHealth")
    ? Object.fromEntries(
        Object.entries(
          profile.assessmentSections.spiritualHealth &&
            typeof profile.assessmentSections.spiritualHealth === "object"
            ? profile.assessmentSections.spiritualHealth
            : {},
        ).filter(([key]) => subsectionEnabled("spiritualHealth", key)),
      )
    : {};
  const hasSpiritualHealth = Object.keys(spiritualHealth).length > 0;
  const apestResult = participantSynthesis.apestResult;
  const ministryTendency = participantSynthesis.ministryTendency;
  const ApestIcon = apestResult ? APEST_BODY_PARTS[apestResult.label]?.icon || Star : Star;
  const TendencyIcon = ministryTendency ? TENDENCIES[ministryTendency.key]?.icon || Star : Star;

  return (
    <div className="space-y-0 pb-16 mt-8 max-w-4xl mx-auto">
      <section className="mb-12">
        <h2 className="font-serif text-3xl font-medium tracking-[-.025em] mb-4">Ministry Portrait (Leader View)</h2>
        <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h3 className="text-2xl font-medium">{snapshot.name}</h3>
            <p className="text-muted-foreground">
              {snapshot.age ? `${snapshot.age} • ` : ""}
              {snapshot.congregation ? `${snapshot.congregation} • ` : ""}
              Completed {snapshot.completionDate ? format(new Date(snapshot.completionDate), "MMM d, yyyy") : "Recently"}
            </p>
          </div>
        </div>
      </section>

      {apestResult && (
      <PortraitChapter number={1} title="Their Part in the Body" icon={ApestIcon}>
        {apestResult ? (
          <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Like the {APEST_BODY_PARTS[apestResult.label]?.part}</div>
            <h3 className="text-2xl font-serif font-medium mb-3">{apestResult.label}</h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {APEST_BODY_PARTS[apestResult.label]?.description}
            </p>
            {apestResult.secondary && (
              <div className="mt-6 pt-5 border-t border-border/40">
                <h4 className="text-sm font-medium mb-1 text-foreground">Secondary Orientation: {apestResult.secondary}</h4>
                <p className="text-sm text-muted-foreground">{APEST_BODY_PARTS[apestResult.secondary]?.description}</p>
              </div>
            )}
            <div className="mt-6 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground italic border border-border/50">
              This is a picture of a ministry orientation, not a limit on how God can use them.
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-6 text-muted-foreground italic">
            No ministry-orientation result was available in this profile’s saved assessment sections.
          </div>
        )}
      </PortraitChapter>
      )}

      {ministryTendency && (
      <PortraitChapter number={2} title="How They Tend to Minister" icon={TendencyIcon}>
        {ministryTendency ? (
          <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Like the {ministryTendency.key}</div>
            <h3 className="text-2xl font-serif font-medium mb-3">{TENDENCIES[ministryTendency.key]?.name}</h3>
            <p className="text-muted-foreground leading-relaxed text-lg mb-6">
              {TENDENCIES[ministryTendency.key]?.explanation}
            </p>
            {ministryTendency.secondaryKey && (
              <div className="mb-6 rounded-xl bg-accent/5 border border-accent/10 p-4 text-sm text-foreground/80">
                Their responses were close to <strong className="font-medium text-accent-foreground">{TENDENCIES[ministryTendency.secondaryKey]?.name}</strong>, suggesting they may draw on both approaches depending on the people and situation.
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border/40">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary/40"></div>
                  Potential Strengths
                </h4>
                <ul className="text-sm space-y-2 text-foreground/80">
                  {TENDENCIES[ministryTendency.key]?.strengths.map(s => <li key={s} className="flex gap-3"><span className="text-primary/40">•</span><span className="leading-snug">{s}</span></li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500/60"></div>
                  Things to Watch
                </h4>
                <ul className="text-sm space-y-2 text-foreground/80">
                  {TENDENCIES[ministryTendency.key]?.blindSpots.map(s => <li key={s} className="flex gap-3"><span className="text-amber-500/60">•</span><span className="leading-snug">{s}</span></li>)}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-6 text-muted-foreground italic">
            No ministry tendency result was available.
          </div>
        )}
      </PortraitChapter>
      )}

      {sectionEnabled("spiritualGifts") && (
      <PortraitChapter number={3} title="What God May Have Equipped Them With" icon={Lightbulb}>
        {participantSynthesis.topGifts.length > 0 ? (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-4">These are spiritual gifts they identified as being strong or prominent in their life.</p>
            <div className="grid gap-4">
              {participantSynthesis.topGifts.map((gift: string) => (
                <div key={gift} className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                  <h4 className="text-lg font-serif font-medium text-foreground">{gift}</h4>
                  <p className="text-muted-foreground mt-1">
                    {spiritualGiftMeanings[gift] || "An identified area of grace and service."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-6 text-muted-foreground italic">
            No spiritual gifts selected.
          </div>
        )}
      </PortraitChapter>
      )}

      {sectionEnabled("passionsInterests") && (
      <PortraitChapter number={4} title="What Moves Their Heart" icon={Heart}>
        {participantSynthesis.themes.length > 0 ? (
          <div className="space-y-4">
            {participantSynthesis.themes.map((theme: { name: string; reason: string }) => (
              <div key={theme.name} className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                <Badge variant="secondary" className="mb-3 bg-secondary/20 hover:bg-secondary/30 text-foreground border-secondary/30">{theme.name}</Badge>
                <p className="text-muted-foreground leading-relaxed">{theme.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-6 text-muted-foreground italic">
            No themes or passions identified.
          </div>
        )}
      </PortraitChapter>
      )}

      {sectionEnabled("aboutYou") && (
      <PortraitChapter number={5} title="What Their Story Has Prepared Them For" icon={BookOpen}>
        <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
          <div className="grid md:grid-cols-2 gap-6">
            {sectionEnabled("aboutYou") && subsectionEnabled("aboutYou", "skillsExperience") && (
              <>
                {hasConversationSkills ? (
                  <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
                    <Value label="Context / Work" value={skillDetails?.context ?? skills.occupation} />
                    <Value label="Training" value={skillDetails?.training} />
                    <Value label="What they enjoy doing" value={skillDetails?.enjoys ?? skills.uniqueSkills} />
                  </div>
                ) : (
                  <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
                    <Value label="Occupation" value={skills.occupation} />
                    <Value label="Unique skill" value={skills.uniqueSkills} />
                    <Value label="Previous ministry experience" value={skills.previousMinistryExperience} />
                    <Value label="Leadership experience" value={skills.leadershipExperience} />
                    <Value label="Mission trip experience" value={skills.missionTripExperience} />
                  </div>
                )}
              </>
            )}
            {sectionEnabled("aboutYou") && subsectionEnabled("aboutYou", "personalInformation") && profile.basicInformation.languages && (
              <div className="md:col-span-2 mt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Languages</h4>
                <Languages value={profile.basicInformation.languages} />
              </div>
            )}
          </div>

          {!isPrinting && sectionEnabled("aboutYou") && subsectionEnabled("aboutYou", "lifeExperiences") && hasValues(profile.lifeExperiences) && (
            <div className="mt-8 pt-6 border-t border-border/40 no-print">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Life Experiences
              </h4>
              <p className="text-sm text-muted-foreground mb-6 italic border-l-2 border-amber-500/40 pl-3 py-1 bg-amber-500/5 rounded-r-lg">
                Shared voluntarily; please handle with care and discretion.
              </p>
              <ObjectValues value={profile.lifeExperiences} />
            </div>
          )}
        </div>
      </PortraitChapter>
      )}

      {(participantSynthesis.season || participantSynthesis.connection || hasSpiritualHealth) && (
      <PortraitChapter number={6} title="Their Current Season" icon={Compass}>
        {(participantSynthesis.season || participantSynthesis.connection) ? (
          <div className="space-y-6">
            {participantSynthesis.season && (
              <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
                <h3 className="text-lg font-serif font-medium mb-3">Capacity & Availability</h3>
                <p className="text-foreground/90 leading-relaxed mb-6">{participantSynthesis.season}</p>
                <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground border border-border/50 italic">
                  Note: A healthy ministry fit considers not only what they could do, but what they can faithfully and sustainably carry in their current season.
                </div>
              </div>
            )}
            {participantSynthesis.connection && (
              <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
                <h3 className="text-lg font-serif font-medium mb-3">Connection to the Body</h3>
                <p className="text-foreground/90 leading-relaxed">{participantSynthesis.connection}</p>
              </div>
            )}
            {hasSpiritualHealth && (
              <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
                <h3 className="text-lg font-serif font-medium mb-2">Spiritual Wellbeing</h3>
                <p className="mb-5 text-sm text-muted-foreground">
                  Pastoral context for care, prayer, and a sustainable next step—not a pass/fail measure or judgment of readiness.
                </p>
                <ObjectValues value={spiritualHealth} />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-6 text-muted-foreground italic">
            No season or connection details available.
          </div>
        )}
      </PortraitChapter>
      )}

      <PortraitChapter number={7} title="Where These Things Come Together" icon={MapPin}>
        <div className="space-y-6">
          {portrait.length > 0 && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
              <h3 className="text-lg font-serif font-medium mb-3 text-foreground">Putting It Together</h3>
              <div className="space-y-3 text-foreground/90 leading-relaxed">
                {portrait.map((sentence) => <p key={sentence}>{sentence}</p>)}
              </div>
            </div>
          )}
          <LeaderFitSection ministryFit={ministryFit} />
        </div>
      </PortraitChapter>

      <PortraitChapter number={8} title="The Conversation" icon={MessageSquare}>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
            <h3 className="text-lg font-serif font-medium mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              Things Worth Discussing
            </h3>
            <p className="text-sm text-muted-foreground mb-4 italic">
              Observations drawn from the profile. Never use these to diagnose or judge.
            </p>
            {thingsWorthDiscussing.length > 0 ? (
              <ul className="space-y-4">
                {thingsWorthDiscussing.map((item, idx) => (
                  <li key={idx} className="border-l-2 border-muted pl-4 py-1">
                    <div className="font-medium text-foreground">{item.title}</div>
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

          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
            <h3 className="text-lg font-serif font-medium mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary/70" />
              Conversation Questions
            </h3>
            <ul className="space-y-4">
              {conversationQuestions.map((q, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-primary/50 font-serif font-bold italic mt-0.5">{idx + 1}.</span>
                  <span className="leading-relaxed text-foreground/90">{q}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PortraitChapter>

      {!isPrinting && (
        <PortraitChapter number={9} title="Private Pastor Notes" icon={ClipboardList} className="no-print border-l-transparent pb-0">
          <PastorNotesEditor profileId={profile.id} />
        </PortraitChapter>
      )}
    </div>
  );
}
