import { useMemo } from "react";
import type { MinistryProfile } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Section, 
  derivedPersonality, 
  numericResponses, 
  rankedApproaches, 
  MINISTRY_APPROACHES,
  STRENGTH_APPROACHES,
  MINISTRY_TAGS,
  Value
} from "../../pages/profile-detail";
import { 
  Footprints, Eye, MessageSquare, Heart, BookOpen,
  Hand, Ear, Shield, Mic, Users, Layers, Star
} from "lucide-react";
import { getMyMinistrySynthesis } from "../../lib/my-profile-derivation";

const APEST_BODY_PARTS: Record<string, { part: string; description: string; icon: any }> = {
  Apostle: { part: "Feet", description: "You naturally help the Body move forward, cross boundaries, and explore new opportunities.", icon: Footprints },
  Prophet: { part: "Eyes", description: "You naturally help the Body notice what others may miss and see situations through the lens of God’s truth.", icon: Eye },
  Evangelist: { part: "Mouth", description: "You naturally help the Body communicate good news and invite others toward Jesus.", icon: MessageSquare },
  Shepherd: { part: "Heart", description: "You naturally help the Body stay connected, cared for, and healthy.", icon: Heart },
  Teacher: { part: "Mind", description: "You naturally help the Body understand truth, gain wisdom, and grow in understanding.", icon: BookOpen },
};

const TENDENCIES: Record<string, { name: string; description: string; explanation: string; strengths: string[]; blindSpots: string[]; icon: any }> = {
  Hands: {
    name: "Helper / Doer",
    description: "You naturally serve by taking action and getting things done.",
    explanation: "You prefer to meet practical needs, solve problems, and see tangible results. You are likely willing to jump in where help is needed.",
    strengths: ["Practical", "Action-oriented", "Problem-solving"],
    blindSpots: ["May overcommit", "May struggle to pause and reflect"],
    icon: Hand
  },
  Ears: {
    name: "Listener",
    description: "You naturally serve by hearing people and providing a safe space.",
    explanation: "You process carefully and make others feel seen and understood. You may pick up on what is unsaid.",
    strengths: ["Empathetic", "Discernment", "Deep relational care"],
    blindSpots: ["May hesitate to speak up", "Can absorb others' emotional burdens"],
    icon: Ear
  },
  Shoulders: {
    name: "Supporter",
    description: "You naturally serve by coming alongside others to strengthen them.",
    explanation: "You provide stability, encouragement, and faithful support to leaders and existing ministries.",
    strengths: ["Loyal", "Encouraging", "Sustainable serving"],
    blindSpots: ["May avoid taking necessary initiative", "May stay in the background too long"],
    icon: Shield
  },
  Voice: {
    name: "Communicator",
    description: "You naturally serve by sharing stories, truth, or encouragement.",
    explanation: "You use words to build up the Body, clarify ideas, or inspire others toward God.",
    strengths: ["Inspiring", "Clear communication", "Teaching"],
    blindSpots: ["May speak before listening fully", "Words have outsized impact"],
    icon: Mic
  },
  Arms: {
    name: "Connector / Welcomer",
    description: "You naturally serve by gathering people and creating belonging.",
    explanation: "You draw people in, make them feel at home, and help them connect with others in the Body.",
    strengths: ["Hospitality", "Warmth", "Network building"],
    blindSpots: ["May struggle with boundaries", "Can prioritize harmony over truth"],
    icon: Users
  },
  Backbone: {
    name: "Organizer / Stabilizer",
    description: "You naturally serve by creating structure and clarity.",
    explanation: "You build the systems, schedules, and plans that allow ministry to happen smoothly.",
    strengths: ["Reliable", "Strategic", "Detail-oriented"],
    blindSpots: ["May become rigid", "Can prioritize the system over the person"],
    icon: Layers
  }
};

const spiritualGiftMeanings: Record<string, string> = {
  "Administration":"organizing people, resources, and systems effectively", "Apostleship":"pioneering, starting, expanding, and establishing new ministries or works", "Discernment of Spirits":"recognizing what is from God, human influence, or spiritual deception", "Evangelism":"communicating the gospel and helping people respond to Jesus", "Exhortation / Encouragement":"strengthening, motivating, comforting, and challenging others", "Faith":"unusual confidence in God’s power, promises, and provision", "Giving":"generously and joyfully sharing resources to advance God’s work and meet needs", "Healing":"being used by God as an instrument of physical, emotional, or spiritual healing", "Helps / Service":"meeting practical needs and supporting others so ministry can happen", "Hospitality":"welcoming people and creating environments where others feel received and cared for", "Interpretation of Tongues":"interpreting a message spoken in tongues", "Knowledge":"understanding and communicating spiritual truth or insight", "Leadership":"providing direction, motivating others, and helping a group move toward God-given goals", "Mercy":"compassionately caring for people who are hurting, struggling, marginalized, or in need", "Miracles":"being used by God in extraordinary demonstrations of His power", "Pastoring / Shepherding":"caring for, protecting, guiding, and nurturing people spiritually", "Prophecy":"communicating a message believed to be prompted by God for strengthening, correction, encouragement, or direction", "Teaching":"explaining and applying biblical truth so others understand and grow", "Tongues":"speaking in a language or spiritual utterance given through the Holy Spirit", "Wisdom":"applying spiritual truth appropriately to real situations", "Craftsmanship":"using artistic or practical skill for God’s purposes", "Intercession":"persistent, focused prayer for others", "Missionary / Cross-Cultural Ministry":"effectively ministering across cultures and communities", "Music / Worship":"using musical ability to lead and encourage worship", "Celibacy":"a particular grace for remaining unmarried for undivided devotion to ministry", "Voluntary Poverty":"willingly living with less in order to serve God and others",
};

export function MyMinistryProfile({ 
  profile, 
  isPrinting,
  isEnabled
}: { 
  profile: MinistryProfile; 
  isPrinting: boolean;
  isEnabled: (section: string, subsection: string) => boolean;
}) {
  const synthesis = useMemo(() => getMyMinistrySynthesis(profile, (k) => isEnabled("naturalStrengths", k)), [profile, isEnabled]);

  const {
    apestResult,
    ministryTendency,
    topGifts,
    themes,
    patterns,
    environments,
    season,
    connection,
    prayerQuestions,
    nextStep
  } = synthesis;

  const ApestIcon = apestResult ? APEST_BODY_PARTS[apestResult.label]?.icon || Star : Star;
  const TendencyIcon = ministryTendency ? TENDENCIES[ministryTendency.key]?.icon || Star : Star;

  return (
    <div className="space-y-12 pb-16">
      
      {/* 1. HEADER EXPLANATION */}
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 text-primary -mt-8 -mr-8">
          <Heart size={180} />
        </div>
        <div className="relative z-10 max-w-3xl">
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

      {/* 2. YOUR MINISTRY SNAPSHOT */}
      <section>
        <h2 className="font-serif text-3xl font-medium tracking-[-.025em] mb-6">Your Ministry Snapshot</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {apestResult && (
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm flex items-start gap-4">
              <div className="flex-none p-4 rounded-full bg-primary/10 text-primary">
                <ApestIcon size={32} />
              </div>
              <div>
                <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">Body Part: {APEST_BODY_PARTS[apestResult.label]?.part}</div>
                <h3 className="text-xl font-serif font-medium">{apestResult.label}</h3>
                <p className="text-sm text-muted-foreground mt-2">{APEST_BODY_PARTS[apestResult.label]?.description}</p>
              </div>
            </div>
          )}
          
          {ministryTendency && (
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm flex items-start gap-4">
              <div className="flex-none p-4 rounded-full bg-accent/10 text-accent">
                <TendencyIcon size={32} />
              </div>
              <div>
                <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">How You Minister</div>
                <h3 className="text-xl font-serif font-medium">{TENDENCIES[ministryTendency.key]?.name}</h3>
                <p className="text-sm text-muted-foreground mt-2">{TENDENCIES[ministryTendency.key]?.description}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* 5. PUTTING IT TOGETHER */}
        {(apestResult || ministryTendency) && (
          <div className="mt-4 rounded-2xl bg-secondary/15 p-6 border border-secondary/30">
            <h3 className="font-medium mb-2 text-foreground">Putting It Together</h3>
            <p className="text-foreground/80 leading-relaxed">
              {synthesis.synthesisText}
            </p>
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* 3. APEST RESULT (Detailed) */}
        {apestResult && (
          <Section title="Your Ministry Orientation">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <ApestIcon size={20} className="text-primary" />
                <h3 className="font-medium text-lg">{apestResult.label}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {APEST_BODY_PARTS[apestResult.label]?.description}
              </p>
            </div>
            {apestResult.secondary && (
              <div className="mt-4 pt-4 border-t border-border/40">
                <h4 className="text-sm font-medium mb-1">Secondary: {apestResult.secondary}</h4>
                <p className="text-xs text-muted-foreground">{APEST_BODY_PARTS[apestResult.secondary]?.description}</p>
              </div>
            )}
            <div className="mt-5 rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground italic">
              This is a picture of a ministry tendency, not a limit on how God can use you.
            </div>
          </Section>
        )}

        {/* 4. HOW YOU TEND TO MINISTER (Detailed) */}
        {ministryTendency && (
          <Section title="How You Tend to Minister">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <TendencyIcon size={20} className="text-accent" />
                <h3 className="font-medium text-lg">{TENDENCIES[ministryTendency.key]?.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {TENDENCIES[ministryTendency.key]?.explanation}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Potential Strengths</h4>
                  <ul className="text-sm space-y-1">
                    {TENDENCIES[ministryTendency.key]?.strengths.map(s => <li key={s} className="flex gap-2"><span className="text-primary/60">•</span>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Things to Watch</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {TENDENCIES[ministryTendency.key]?.blindSpots.map(s => <li key={s} className="flex gap-2"><span className="text-destructive/40">•</span>{s}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </Section>
        )}

      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 6. YOUR STRONGEST SPIRITUAL GIFTS */}
        {topGifts.length > 0 && (
          <Section title="Spiritual Gifts">
            <p className="text-sm text-muted-foreground mb-5">These are areas you identified as being strong or prominent in your life.</p>
            <div className="space-y-4">
              {topGifts.map(gift => (
                <div key={gift} className="border-l-2 border-primary/30 pl-4 py-1">
                  <h4 className="font-medium">{gift}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {spiritualGiftMeanings[gift] || "An identified area of grace and service."}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground italic">
              Spiritual gifts are given by God for the common good. You may use these gifts through many different environments or relationships.
            </div>
          </Section>
        )}

        {/* 7. WHAT SEEMS TO MATTER TO YOU */}
        {themes.length > 0 && (
          <Section title="What Matters To You">
             <div className="space-y-4">
              {themes.map(theme => (
                <div key={theme.name}>
                  <Badge variant="secondary" className="mb-2">{theme.name}</Badge>
                  <p className="text-sm text-muted-foreground leading-relaxed">{theme.reason}</p>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* 8. YOUR MINISTRY PATTERN */}
      {patterns.length > 0 && (
        <Section title="Your Ministry Pattern">
          <p className="text-sm text-muted-foreground mb-5">Looking across your whole profile, these patterns emerge in how you approach ministry:</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {patterns.map(pattern => (
              <div key={pattern} className="rounded-xl bg-card border border-border/60 p-4 shadow-sm text-center">
                <span className="font-medium text-foreground">{pattern}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 9. WHERE YOU MIGHT FLOURISH */}
      {environments.length > 0 && (
        <Section title="Where You Might Flourish">
           <p className="text-sm text-muted-foreground mb-5">These are not job assignments, but environments that align with your shape. They may be worth prayerfully exploring.</p>
           <div className="space-y-4">
            {environments.map(env => (
              <div key={env.name} className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between rounded-xl border border-border/50 p-4 bg-muted/10">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    {env.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">{env.reason}</p>
                </div>
                <Badge variant={env.match === "Strong Alignment" ? "default" : env.match === "Worth Exploring" ? "secondary" : "outline"} className="shrink-0 whitespace-nowrap">
                  {env.match}
                </Badge>
              </div>
            ))}
           </div>
        </Section>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* 10. YOUR CURRENT SEASON */}
        {season && (
          <Section title="Your Current Season">
             <p className="text-sm text-foreground/90 leading-relaxed mb-4">{season}</p>
             <div className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground border border-border/40">
               <span className="font-medium text-foreground">Note:</span> A healthy ministry fit considers not only what you could do, but what you can faithfully and sustainably carry in your current season.
             </div>
          </Section>
        )}

        {/* 11. YOUR CONNECTION TO THE BODY */}
        {connection && (
          <Section title="Connection to the Body">
            <p className="text-sm leading-relaxed">{connection}</p>
          </Section>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 12. QUESTIONS TO PRAY ABOUT */}
        {prayerQuestions.length > 0 && (
          <Section title="Questions to Pray About">
            <p className="text-sm text-muted-foreground mb-4">Use these questions for personal reflection or conversation with a leader:</p>
            <ul className="space-y-3">
              {prayerQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-primary/50 font-serif font-bold italic">{i+1}.</span>
                  <span className="text-sm leading-relaxed">{q}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* 13. POSSIBLE NEXT STEP */}
        {nextStep && (
          <Section title="Possible Next Step">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
              <Footprints className="mx-auto mb-3 h-8 w-8 text-primary/60" />
              <h3 className="font-serif text-xl font-medium mb-2">{nextStep.title}</h3>
              <p className="text-sm text-muted-foreground">{nextStep.description}</p>
            </div>
          </Section>
        )}
      </div>

      {/* 14. YOUR PART IN ONE PICTURE */}
      <section className="print:mt-12 break-inside-avoid">
        <h2 className="font-serif text-2xl font-medium tracking-[-.025em] mb-4 print:hidden">Your Part in One Picture</h2>
        <Card className="border-border/80 shadow-md bg-card overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground flex justify-between items-center">
            <div>
              <h2 className="font-serif text-2xl font-medium">{profile.memberName}</h2>
              <p className="text-primary-foreground/80 text-sm mt-1">Ministry Profile Summary</p>
            </div>
            <Heart className="h-8 w-8 text-primary-foreground/30" />
          </div>
          <CardContent className="p-6 md:p-8">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
              {apestResult && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                    <ApestIcon size={14}/> {APEST_BODY_PARTS[apestResult.label]?.part}
                  </div>
                  <div className="font-serif text-xl">{apestResult.label}</div>
                </div>
              )}
              {ministryTendency && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                    <TendencyIcon size={14}/> How You Minister
                  </div>
                  <div className="font-serif text-xl">{TENDENCIES[ministryTendency.key]?.name}</div>
                </div>
              )}
              {topGifts.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Top Gifts</div>
                  <div className="space-y-1">
                    {topGifts.slice(0, 3).map(g => <div key={g} className="text-sm font-medium">{g}</div>)}
                  </div>
                </div>
              )}
              {themes.length > 0 && (
                <div className="sm:col-span-2 md:col-span-3 border-t border-border/40 pt-6 mt-2">
                  <div className="grid md:grid-cols-3 gap-8">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Primary Themes</div>
                      <div className="space-y-1">
                        {themes.map(t => <div key={t.name} className="text-sm font-medium">{t.name}</div>)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Potential Areas</div>
                      <div className="space-y-1">
                        {environments.slice(0, 3).map(e => <div key={e.name} className="text-sm font-medium">{e.name}</div>)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Current Season</div>
                      <div className="text-sm text-muted-foreground line-clamp-3">{season || "Available to serve"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
      
    </div>
  );
}