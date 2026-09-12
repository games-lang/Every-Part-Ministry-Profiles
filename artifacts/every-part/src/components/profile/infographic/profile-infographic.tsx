import type { ReactNode } from "react";
import type { MinistryProfile } from "@workspace/api-client-react";
import type { LucideIcon } from "lucide-react";
import type { getMyMinistrySynthesis } from "../../../lib/my-profile-derivation";
import {
  Check, 
  Flag, 
  Leaf, 
  MapPin, 
  Star, 
  Heart,
  Compass,
  ShieldAlert,
  HelpCircle,
  Activity
} from "lucide-react";

type MinistrySynthesis = ReturnType<typeof getMyMinistrySynthesis>;
type BodyPartMap = Record<
  string,
  { part: string; description: string; icon: LucideIcon }
>;
type TendencyMap = Record<
  string,
  {
    name: string;
    description: string;
    explanation: string;
    strengths: string[];
    blindSpots: string[];
    icon: LucideIcon;
  }
>;

function contrastText(color: string) {
  const normalized = color.trim().replace("#", "");
  const hex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => character + character)
          .join("")
      : normalized;
  if (!/^[0-9a-f]{6}$/i.test(hex)) return "#ffffff";

  const channels = [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ].map((channel) => {
    const normalizedChannel = channel / 255;
    return normalizedChannel <= 0.03928
      ? normalizedChannel / 12.92
      : ((normalizedChannel + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  const whiteContrast = 1.05 / (luminance + 0.05);
  const darkLuminance = 0.014;
  const darkContrast = (luminance + 0.05) / (darkLuminance + 0.05);
  return darkContrast >= whiteContrast ? "#172033" : "#ffffff";
}

export function ProfileInfographic({ 
  profile, 
  synthesis,
  bodyParts,
  tendencies,
  spiritualGiftMeanings,
  sectionEnabled,
  subsectionEnabled,
}: { 
  profile: MinistryProfile; 
  synthesis: MinistrySynthesis;
  bodyParts: BodyPartMap;
  tendencies: TendencyMap;
  spiritualGiftMeanings: Record<string, string>;
  sectionEnabled: (section: string) => boolean;
  subsectionEnabled: (section: string, subsection: string) => boolean;
}) {
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

  const primaryColor = profile.branding?.primaryColor || "hsl(var(--primary))";
  const accentColor = profile.branding?.accentColor || "hsl(var(--accent))";
  const primaryForeground = contrastText(primaryColor);
  const accentForeground = contrastText(accentColor);
  
  const ApestIcon = apestResult
    ? bodyParts[apestResult.label]?.icon || Star
    : Star;
  const TendencyIcon = ministryTendency
    ? tendencies[ministryTendency.key]?.icon || Star
    : Star;

  const savedHealthData = (profile.assessmentSections?.spiritualHealth || {}) as Record<string, string>;
  const healthData = sectionEnabled("spiritualHealth")
    ? Object.fromEntries(
        Object.entries(savedHealthData).filter(([key]) =>
          subsectionEnabled("spiritualHealth", key),
        ),
      )
    : {};
  const healthLabels: Record<string, string> = {
    prayer: "Prayer Life",
    scripture: "Bible & the Word",
    worship: "Church & Worship",
    relationships: "Key Relationships",
    community: "Community & Accountability",
    rest: "Soul Care & Rest",
    motivation: "Serving Motivation",
    wellbeing: "Emotional Well-being",
    connection: "Connection with God"
  };

  const healthStrengths = Object.entries(healthData)
    .filter(([_, value]) => value === "Feeling strong" || value === "Growing")
    .map(([key]) => healthLabels[key]);
  
  const healthGrowth = Object.entries(healthData)
    .filter(([_, value]) => value === "Needs attention")
    .map(([key]) => healthLabels[key]);
    
  const healthSteady = Object.entries(healthData)
    .filter(([_, value]) => value === "Steady")
    .map(([key]) => healthLabels[key]);

  return (
    <div className="profile-infographic w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xl print:rounded-none print:shadow-none print:border-none relative font-sans text-slate-800" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      {/* HEADER */}
      <div 
        className="px-6 py-8 md:px-8 md:py-10 relative overflow-hidden"
        style={{ backgroundColor: primaryColor, color: primaryForeground }}
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-10 pointer-events-none">
          <Heart size={300} color="white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between md:items-end">
          <div>
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2 opacity-80">
              <span className="w-8 h-[2px]" style={{ backgroundColor: accentColor }}></span>
              Ministry Profile
            </h3>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-2">
              {profile.memberName}
            </h1>
            {profile.branding?.name && (
              <p className="text-lg opacity-90">
                {profile.branding.name}
              </p>
            )}
          </div>
          <div className="flex gap-4 items-center shrink-0">
            {profile.branding?.logoUrl && (
              <div className="h-16 w-16 bg-white p-2 rounded-xl flex items-center justify-center">
                <img src={profile.branding.logoUrl} alt={`${profile.branding.name} logo`} className="max-h-full max-w-full object-contain" />
              </div>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${accentColor}, ${primaryColor})` }} />
      </div>

      {/* MAIN GRID */}
      <div className="p-5 md:p-8 bg-slate-50/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 print:grid-cols-2 print:gap-4 print:text-sm">
          
          {/* BLOCK 1: APEST */}
          <InfographicBlock 
            number="1" 
            title="MINISTRY ORIENTATION" 
            color={primaryColor}
            isEmpty={!apestResult}
          >
            {apestResult && (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: primaryColor, color: primaryForeground }}>
                    <ApestIcon size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                      Tends to minister like the {bodyParts[apestResult.label]?.part}
                    </div>
                    <h3 className="text-xl font-serif font-medium text-slate-800 leading-none">{apestResult.label}</h3>
                  </div>
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-4 flex-grow">
                  {bodyParts[apestResult.label]?.description}
                </p>
                {apestResult.secondary && (
                  <div className="mt-auto pt-3 border-t border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Secondary</p>
                    <p className="text-xs font-medium text-slate-700">{apestResult.secondary}</p>
                  </div>
                )}
              </div>
            )}
          </InfographicBlock>

          {/* BLOCK 2: TENDENCY */}
          <InfographicBlock 
            number="2" 
            title="HOW YOU TEND TO MINISTER" 
            color={accentColor}
            isEmpty={!ministryTendency}
          >
            {ministryTendency && (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: accentColor, color: accentForeground }}>
                    <TendencyIcon size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                       You tend to minister like the {ministryTendency.key}
                    </div>
                    <h3 className="text-xl font-serif font-medium text-slate-800 leading-none">
                      {tendencies[ministryTendency.key]?.name}
                    </h3>
                  </div>
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
                  {tendencies[ministryTendency.key]?.explanation}
                </p>
                <p className="text-[10px] text-slate-500 italic mb-4">
                  This describes a flexible tendency, not a fixed identity or a ministry assignment.
                </p>
                
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 mb-1.5 flex items-center gap-1">
                      <Check size={10} /> Strengths
                    </div>
                    <ul className="space-y-1">
                      {tendencies[ministryTendency.key]?.strengths.slice(0,3).map((s) => (
                        <li key={s} className="text-[11px] text-slate-600 flex items-start gap-1">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          <span className="leading-tight">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-amber-600 mb-1.5 flex items-center gap-1">
                      <Flag size={10} /> Blind Spots
                    </div>
                    <ul className="space-y-1">
                      {tendencies[ministryTendency.key]?.blindSpots.slice(0,2).map((s) => (
                        <li key={s} className="text-[11px] text-slate-600 flex items-start gap-1">
                          <span className="text-amber-500 mt-0.5">•</span>
                          <span className="leading-tight">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </InfographicBlock>

          {/* BLOCK 3: GIFTS */}
          <InfographicBlock 
            number="3" 
            title="SPIRITUAL GIFTS" 
            color={primaryColor}
            isEmpty={topGifts.length === 0}
          >
            <div className="flex flex-col h-full">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1.5">
                Identified areas of grace
              </div>
              <div className="space-y-3 flex-grow">
                {topGifts.slice(0, 3).map((gift: string) => (
                  <div key={gift}>
                    <h4 className="font-serif text-base font-medium text-slate-800 leading-tight mb-0.5">{gift}</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {spiritualGiftMeanings[gift] || "An identified area of grace and service."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </InfographicBlock>

          {/* BLOCK 4: WHAT MATTERS */}
          <InfographicBlock 
            number="4" 
            title="WHAT MATTERS TO YOU" 
            color={accentColor}
            isEmpty={themes.length === 0}
          >
            <div className="flex flex-col h-full">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1.5">
                Themes & Passions
              </div>
              <div className="space-y-3">
                  {themes.slice(0, 3).map((theme) => (
                  <div key={theme.name} className="flex gap-2">
                    <div className="mt-0.5 text-slate-300 shrink-0"><Heart size={14} fill="currentColor" /></div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-0.5">{theme.name}</h4>
                      <p className="text-[11px] text-slate-500 leading-snug">{theme.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </InfographicBlock>

          {/* BLOCK 5: PATTERNS */}
          <InfographicBlock 
            number="5" 
            title="YOUR PROFILE IN ONE SENTENCE" 
            color={primaryColor}
            isEmpty={!synthesis.synthesisText}
          >
            <div className="flex flex-col h-full">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1.5">
                A starting point for reflection
              </div>
              <p className="font-serif text-lg leading-relaxed text-slate-700">
                {synthesis.synthesisText}
              </p>
            </div>
          </InfographicBlock>

          {/* BLOCK 6: SPIRITUAL HEALTH */}
          <InfographicBlock 
            number="6" 
            title="SPIRITUAL HEALTH" 
            color="#10B981"
            isEmpty={Object.keys(healthData).length === 0}
          >
            <div className="flex flex-col h-full">
               <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-medium text-slate-800 leading-tight">Current Snapshot</h3>
                    <p className="text-[9px] uppercase tracking-wider text-slate-400">Self-Reflection</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 gap-3 flex-grow">
                  {healthStrengths.length > 0 && (
                   <div>
                     <h4 className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 mb-1.5">Feeling Strong / Growing</h4>
                     <ul className="space-y-1">
                        {healthStrengths.slice(0, 5).map(item => (
                         <li key={item} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                           <Check size={10} className="text-emerald-500 shrink-0" /> <span className="truncate">{item}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}
                  {healthSteady.length > 0 && (
                    <div>
                      <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Steady</h4>
                      <ul className="space-y-1">
                        {healthSteady.slice(0, 5).map(item => (
                          <li key={item} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                            <Check size={10} className="text-slate-400 shrink-0" /> <span className="truncate">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                 {healthGrowth.length > 0 && (
                   <div className="mt-1 pt-2 border-t border-slate-100">
                     <h4 className="text-[9px] font-bold uppercase tracking-wider text-amber-600 mb-1.5">Needs Attention</h4>
                     <ul className="space-y-1">
                       {healthGrowth.map(item => (
                         <li key={item} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                           <ShieldAlert size={10} className="text-amber-500 shrink-0" /> <span className="truncate">{item}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}
               </div>
            </div>
          </InfographicBlock>

          {/* BLOCK 7: CONNECTION & SEASON */}
          <InfographicBlock 
            number="7" 
            title="CONNECTION & SEASON" 
            color={accentColor}
            isEmpty={!connection && !season}
          >
            <div className="flex flex-col h-full gap-4">
              {connection && (
                <div>
                  <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <MapPin size={10} /> Body Connection
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">{connection}</p>
                </div>
              )}
              {season && (
                <div>
                  <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <Compass size={10} /> Current Season
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">{season}</p>
                </div>
              )}
            </div>
          </InfographicBlock>

          {/* BLOCK 8: ENVIRONMENTS */}
          <InfographicBlock 
            number="8" 
            title="MINISTRY INTERESTS YOU NAMED" 
            color={primaryColor}
            isEmpty={environments.length === 0}
          >
            <div className="flex flex-col h-full">
              <p className="text-[11px] text-slate-500 mb-3 italic">
                Areas you may want to explore prayerfully:
              </p>
              <div className="space-y-2">
                  {environments.slice(0, 4).map((env) => (
                  <div key={env.name} className="flex flex-col border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start gap-2 mb-0.5">
                      <h4 className="text-xs font-bold text-slate-700 leading-tight truncate">{env.name}</h4>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 bg-blue-100 text-blue-700">
                        {env.match}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-snug line-clamp-1">{env.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </InfographicBlock>

          {/* BLOCK 9: NEXT STEP */}
          <InfographicBlock 
            number="9" 
            title="NEXT STEP & REFLECTION" 
            color={accentColor}
            isEmpty={!nextStep && prayerQuestions.length === 0}
          >
            <div className="flex flex-col h-full">
               {nextStep && (
                 <div className="mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200 shadow-sm text-center">
                   <h4 className="text-[11px] font-bold text-slate-800 mb-0.5 uppercase tracking-wider">{nextStep.title}</h4>
                   <p className="text-[10px] text-slate-500 leading-snug">{nextStep.description}</p>
                 </div>
               )}
               {prayerQuestions.length > 0 && (
                 <div>
                   <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                     <HelpCircle size={10} /> Questions to Pray About
                   </h4>
                   <ul className="space-y-1.5">
                     {prayerQuestions.slice(0, 2).map((q: string, i: number) => (
                       <li key={i} className="text-[10px] text-slate-600 flex items-start gap-1.5">
                         <span className="text-slate-300 font-serif font-bold italic leading-none mt-0.5">{i+1}.</span>
                         <span className="leading-snug">{q}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
               )}
            </div>
          </InfographicBlock>

        </div>
      </div>
      
      {/* FOOTER */}
      <div className="bg-slate-800 text-white px-6 py-4 md:px-8 text-center flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-xs text-slate-300 italic">
          "Now you are the body of Christ, and each one of you is a part of it." — 1 Corinthians 12:27
        </p>
        <div className="flex items-center gap-1.5 opacity-50 shrink-0">
           <Leaf size={14} />
           <span className="text-[10px] font-bold tracking-widest uppercase">Every Part</span>
        </div>
      </div>
    </div>
  );
}

function InfographicBlock({ 
  number, 
  title, 
  color, 
  children,
  isEmpty 
}: { 
  number: string; 
  title: string; 
  color: string; 
  children: ReactNode;
  isEmpty?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col h-full print:break-inside-avoid">
      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: color }} />
      <div className="flex items-center gap-3 mb-5">
        <div 
          className="w-8 h-8 rounded flex items-center justify-center font-bold text-lg font-serif shrink-0 shadow-sm"
          style={{ backgroundColor: color, color: contrastText(color) }}
        >
          {number}
        </div>
        <h2 className="text-sm font-bold tracking-wider uppercase text-slate-700">{title}</h2>
      </div>
      <div className="flex-grow flex flex-col">
        {isEmpty ? (
          <div className="text-sm text-slate-400 italic flex-grow flex items-center justify-center text-center">
            Information not available in this profile.
          </div>
        ) : children}
      </div>
    </div>
  );
}
