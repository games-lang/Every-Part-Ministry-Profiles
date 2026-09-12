import { useMemo } from "react";
import type { MinistryProfile } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Value, Languages, ObjectValues } from "../../pages/profile-detail";
import { 
  Footprints, Eye, MessageSquare, Heart, BookOpen,
  Hand, Ear, Shield, Mic, Users, Layers, Star,
  Compass, Lightbulb, MapPin
} from "lucide-react";
import { getMyMinistrySynthesis } from "../../lib/my-profile-derivation";
import { ProfileInfographic } from "./infographic/profile-infographic";
import { PortraitChapter } from "./portrait-chapter";
import { buildMinistryPortrait } from "../../lib/ministry-portrait";

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

export function MyMinistryProfile({ 
  profile, 
  isPrinting,
  sectionEnabled,
  subsectionEnabled,
}: { 
  profile: MinistryProfile; 
  isPrinting: boolean;
  sectionEnabled: (section: string) => boolean;
  subsectionEnabled: (section: string, subsection: string) => boolean;
}) {
  const synthesis = useMemo(
    () => getMyMinistrySynthesis(profile, sectionEnabled, subsectionEnabled),
    [profile, sectionEnabled, subsectionEnabled],
  );

  const {
    apestResult,
    ministryTendency,
    topGifts,
    themes,
    environments,
    season,
    connection,
    prayerQuestions,
    nextStep
  } = synthesis;

  const skills = profile.skills;
  const skillDetails = skills.details && typeof skills.details === "object" && !Array.isArray(skills.details) ? skills.details as Record<string, unknown> : null;
  const hasConversationSkills = Boolean(skillDetails && ("context" in skillDetails || "training" in skillDetails || "enjoys" in skillDetails));
  const portrait = buildMinistryPortrait(
    profile,
    synthesis,
    sectionEnabled,
    subsectionEnabled,
    "participant",
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

  const ApestIcon = apestResult ? APEST_BODY_PARTS[apestResult.label]?.icon || Star : Star;
  const TendencyIcon = ministryTendency ? TENDENCIES[ministryTendency.key]?.icon || Star : Star;

  if (isPrinting) {
    return (
      <ProfileInfographic
        profile={profile}
        synthesis={synthesis}
        bodyParts={APEST_BODY_PARTS}
        tendencies={TENDENCIES}
        spiritualGiftMeanings={spiritualGiftMeanings}
        sectionEnabled={sectionEnabled}
        subsectionEnabled={subsectionEnabled}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-16 print:hidden">
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 relative overflow-hidden mb-12">
        <div className="absolute right-0 top-0 opacity-10 text-primary -mt-8 -mr-8 pointer-events-none">
          <Heart size={180} />
        </div>
        <div className="relative z-10">
          <h2 className="text-xl md:text-2xl font-serif text-primary font-medium tracking-tight mb-2">Your Part Matters</h2>
          <blockquote className="text-lg italic text-foreground mb-4 border-l-2 border-primary/30 pl-4 py-1">
            "Now you are the body of Christ, and each one of you is a part of it." <br />
            <span className="text-sm font-medium not-italic text-muted-foreground">— 1 Corinthians 12:27</span>
          </blockquote>
          <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
            This profile is not meant to put you in a box or simply tell you where to volunteer. It is designed to help you and your ministry leaders prayerfully understand how God may be shaping you to serve, grow, and help build up the Church.
          </p>
        </div>
      </section>

      <div className="space-y-0">
        {apestResult && (
        <PortraitChapter number={1} title="Your Part in the Body" icon={ApestIcon}>
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
                This is a picture of a ministry orientation, not a limit on how God can use you.
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
        <PortraitChapter number={2} title="How You Tend to Minister" icon={TendencyIcon}>
          {ministryTendency ? (
            <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
              <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Like the {ministryTendency.key}</div>
              <h3 className="text-2xl font-serif font-medium mb-3">{TENDENCIES[ministryTendency.key]?.name}</h3>
              <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                {TENDENCIES[ministryTendency.key]?.explanation}
              </p>
              {ministryTendency.secondaryKey && (
                <div className="mb-6 rounded-xl bg-accent/5 border border-accent/10 p-4 text-sm text-foreground/80">
                  Your scores were close to <strong className="font-medium text-accent-foreground">{TENDENCIES[ministryTendency.secondaryKey]?.name}</strong>, suggesting you may draw on both approaches depending on the people and situation.
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
        <PortraitChapter number={3} title="What God May Have Equipped You With" icon={Lightbulb}>
          {topGifts.length > 0 ? (
            <div className="space-y-4">
              <p className="text-muted-foreground mb-4">These are spiritual gifts you identified as being strong or prominent in your life.</p>
              <div className="grid gap-4">
                {topGifts.map(gift => (
                  <div key={gift} className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                    <h4 className="text-lg font-serif font-medium text-foreground">{gift}</h4>
                    <p className="text-muted-foreground mt-1">
                      {spiritualGiftMeanings[gift] || "An identified area of grace and service."}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground italic border border-border/50">
                Spiritual gifts are given by God for the common good. You may use these gifts through many different environments or relationships.
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
        <PortraitChapter number={4} title="What Moves Your Heart" icon={Heart}>
          {themes.length > 0 ? (
            <div className="space-y-4">
              {themes.map(theme => (
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
        <PortraitChapter number={5} title="What Your Story Has Prepared You For" icon={BookOpen}>
          <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
            <div className="grid md:grid-cols-2 gap-6">
              {sectionEnabled("aboutYou") && subsectionEnabled("aboutYou", "skillsExperience") && (
                <>
                  {hasConversationSkills ? (
                    <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
                      <Value label="Context / Work" value={skillDetails?.context ?? skills.occupation} />
                      <Value label="Training" value={skillDetails?.training} />
                      <Value label="What you enjoy doing" value={skillDetails?.enjoys ?? skills.uniqueSkills} />
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
            {!(sectionEnabled("aboutYou") && (subsectionEnabled("aboutYou", "skillsExperience") || subsectionEnabled("aboutYou", "personalInformation"))) && (
              <div className="text-muted-foreground italic">No story details available.</div>
            )}
          </div>
        </PortraitChapter>
        )}

        {(season || connection || hasSpiritualHealth) && (
        <PortraitChapter number={6} title="Your Current Season" icon={Compass}>
          {(season || connection) ? (
            <div className="space-y-6">
              {season && (
                <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
                  <h3 className="text-lg font-serif font-medium mb-3">Capacity & Availability</h3>
                  <p className="text-foreground/90 leading-relaxed mb-6">{season}</p>
                  <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground border border-border/50 italic">
                    A healthy ministry fit considers not only what you could do, but what you can faithfully and sustainably carry in your current season.
                  </div>
                </div>
              )}
              {connection && (
                <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
                  <h3 className="text-lg font-serif font-medium mb-3">Connection to the Body</h3>
                  <p className="text-foreground/90 leading-relaxed">{connection}</p>
                </div>
              )}
              {hasSpiritualHealth && (
                <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
                  <h3 className="text-lg font-serif font-medium mb-2">Spiritual Wellbeing</h3>
                  <p className="mb-5 text-sm text-muted-foreground">
                    This reflection adds context for care, prayer, and a sustainable next step. It is not a measure of worth or readiness.
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
          {environments.length > 0 || (apestResult || ministryTendency) ? (
            <div className="space-y-6">
              {portrait.length > 0 && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
                  <h3 className="text-lg font-serif font-medium mb-3 text-foreground">Putting It Together</h3>
                  <div className="space-y-3 text-foreground/90 leading-relaxed">
                    {portrait.map((sentence) => <p key={sentence}>{sentence}</p>)}
                  </div>
                </div>
              )}

              {environments.length > 0 && (
                <div className="space-y-4 pt-2">
                  <p className="text-muted-foreground mb-4">You named these as areas of interest. They may be worth prayerfully exploring in conversation, without assuming assignment or readiness.</p>
                  {environments.map(env => (
                    <div key={env.name} className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between rounded-2xl border border-border/80 p-5 bg-card shadow-sm">
                      <div>
                        <h4 className="text-lg font-medium">{env.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{env.reason}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 whitespace-nowrap bg-background">
                        {env.match}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border/50 bg-muted/20 p-6 text-muted-foreground italic">
              No synthesis or environments available.
            </div>
          )}
        </PortraitChapter>

        <PortraitChapter number={8} title="The Conversation" icon={MessageSquare}>
          <div className="grid md:grid-cols-2 gap-6">
            {prayerQuestions.length > 0 && (
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                <h3 className="text-lg font-serif font-medium mb-4">Questions to Pray About</h3>
                <ul className="space-y-4">
                  {prayerQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-primary/50 font-serif font-bold italic mt-0.5">{i+1}.</span>
                      <span className="leading-relaxed text-foreground/90">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {nextStep && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center flex flex-col items-center justify-center">
                <Footprints className="mb-4 h-10 w-10 text-primary/60" />
                <h3 className="font-serif text-2xl font-medium mb-3">{nextStep.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{nextStep.description}</p>
              </div>
            )}
          </div>
        </PortraitChapter>
      </div>
    </div>
  );
}
