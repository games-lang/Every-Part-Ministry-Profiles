import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  getGetMyChurchQueryKey,
  getGetPublicChurchQueryKey,
  getListChurchAdminsQueryKey,
  requestUploadUrl,
  useAddChurchAdmin,
  useGetMyChurch,
  useListChurchAdmins,
  useRemoveChurchAdmin,
  useUpdateMyChurch,
  type SpiritualGiftName,
  type ChurchAdmin,
  type UploadUrlRequestContentType,
  type AssessmentConfigurationSections,
  type AssessmentConfigurationSubsections,
  type MinistryCustomization,
  type MinistryCustomizationMode,
  type MinistryCustomizationTradition,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ChurchRemovalHistory } from "@/components/church-removal-history";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, BookOpenCheck, ChevronDown, Clock3, Copy, ExternalLink, Eye, ImagePlus, Loader2, Palette, RefreshCw, Trash2, Upload, UserPlus, UsersRound } from "lucide-react";
import {
  CHURCH_TRADITIONS,
  DEFAULT_MINISTRY_CUSTOMIZATION,
  STANDARD_MINISTRY_LABELS,
  excludedSpiritualGifts,
  recommendedSpiritualGifts,
  recommendedMinistryLabels,
} from "@/lib/ministry-customization";

const sectionSchema = z.object({
  aboutYou: z.boolean(),
  apest: z.boolean(),
  spiritualGifts: z.boolean(),
  passionsInterests: z.boolean(),
  naturalStrengths: z.boolean(),
  personalityStrengths: z.boolean(),
  spiritualHealth: z.boolean(),
  connectionAvailability: z.boolean(),
});

const subsectionSchema = z.object({
  'aboutYou.personalInformation': z.boolean(),
  'aboutYou.phone': z.boolean(),
  'aboutYou.preferredContact': z.boolean(),
  'aboutYou.familySituation': z.boolean(),
  'aboutYou.transportation': z.boolean(),
  'aboutYou.languages': z.boolean(),
  'aboutYou.profilePhoto': z.boolean(),
  'aboutYou.skillsExperience': z.boolean(),
  'aboutYou.lifeExperiences': z.boolean(),
  'apest.builder': z.boolean(),
  'apest.insight': z.boolean(),
  'apest.connector': z.boolean(),
  'apest.caregiver': z.boolean(),
  'apest.teacher': z.boolean(),
  'passionsInterests.passions': z.boolean(),
  'passionsInterests.ministryInterests': z.boolean(),
  'naturalStrengths.relationalConnection': z.boolean(),
  'naturalStrengths.encouragement': z.boolean(),
  'naturalStrengths.teachingExplaining': z.boolean(),
  'naturalStrengths.listening': z.boolean(),
  'naturalStrengths.leadershipInitiative': z.boolean(),
  'naturalStrengths.organizing': z.boolean(),
  'naturalStrengths.creativeExpression': z.boolean(),
  'naturalStrengths.problemSolving': z.boolean(),
  'naturalStrengths.practicalHandsOn': z.boolean(),
  'naturalStrengths.hospitality': z.boolean(),
  'naturalStrengths.compassionCare': z.boolean(),
  'naturalStrengths.communicationStorytelling': z.boolean(),
  'naturalStrengths.discernment': z.boolean(),
  'naturalStrengths.followThrough': z.boolean(),
  'naturalStrengths.adaptability': z.boolean(),
  'naturalStrengths.mentoringDevelopment': z.boolean(),
  'naturalStrengths.strategicThinking': z.boolean(),
  'naturalStrengths.advocacyJustice': z.boolean(),
  'personalityStrengths.socialEnergy': z.boolean(),
  'personalityStrengths.decisionLens': z.boolean(),
  'personalityStrengths.planningStyle': z.boolean(),
  'personalityStrengths.focusStyle': z.boolean(),
  'personalityStrengths.actionStyle': z.boolean(),
  'personalityStrengths.pacePreference': z.boolean(),
  'personalityStrengths.workStyle': z.boolean(),
  'personalityStrengths.ministryPreferences': z.boolean(),
  'spiritualHealth.prayer': z.boolean(),
  'spiritualHealth.scripture': z.boolean(),
  'spiritualHealth.worship': z.boolean(),
  'spiritualHealth.relationships': z.boolean(),
  'spiritualHealth.community': z.boolean(),
  'spiritualHealth.rest': z.boolean(),
  'spiritualHealth.motivation': z.boolean(),
  'spiritualHealth.wellbeing': z.boolean(),
  'spiritualHealth.connection': z.boolean(),
  'connectionAvailability.churchConnection': z.boolean(),
  'connectionAvailability.availability': z.boolean(),
});

const GENERIC_PASSIONS = [
  "Children", "Youth", "Young adults", "Families", "New Christians",
  "People who don't know Jesus", "Immigrants/refugees", "Multicultural ministry",
  "Missions", "People experiencing poverty", "Addiction recovery", "Grief",
  "Elderly adults", "Prayer", "Discipleship", "Worship", "Community outreach",
  "Justice/compassion", "Second-generation ministry",
] as const;
const GENERIC_MINISTRY_INTERESTS = [
  "Children", "Preschool", "Youth", "Young adults", "Worship", "Sound/tech",
  "Hospitality", "Greeting", "Prayer", "Small groups", "Discipleship",
  "Outreach", "Missions", "Communications", "Office/admin", "Finance",
  "Event planning", "Translation", "Transportation", "Maintenance",
  "Care ministry", "Leadership",
] as const;

const churchFormSchema = z.object({
  name: z.string().min(1, "Church name is required"),
  adminName: z.string().min(1, "Admin name is required"),
  adminEmail: z.string().email("Valid email is required"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  address: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a 6-digit hex color"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a 6-digit hex color"),
  enabledSpiritualGifts: z.array(z.string()).min(3, "Enable at least three spiritual gifts"),
  assessmentConfiguration: z.object({
    sections: sectionSchema,
    subsections: subsectionSchema,
    spiritualGiftQuestionCount: z.number().int().min(1).max(4),
    ministryQuestionCount: z.number().int().min(1).max(4),
    passions: z.array(z.string().min(1).max(80)).max(100),
    ministryInterests: z.array(z.string().min(1).max(80)).max(100),
    // The API normalizes this versioned object for older churches. Keep it in
    // the same shared form so changing editors never loses unsaved work.
    youthProfiles: z.any().optional(),
  }),
  ministryCustomization: z.object({
    version: z.literal(1),
    mode: z.enum(["standard", "tradition", "custom"]),
    tradition: z.enum([
      "wesleyanHoliness",
      "nazarene",
      "methodist",
      "baptist",
      "pentecostalCharismatic",
      "assembliesOfGod",
      "presbyterianReformed",
      "lutheran",
      "anglicanEpiscopal",
      "catholic",
      "easternOrthodox",
      "nonDenominational",
      "independentEvangelical",
      "other",
      "preferNotToSpecify",
    ]),
    customTradition: z.string().max(120),
    spiritualGiftsLabel: z.string().trim().min(1).max(80),
    ministryInterestsLabel: z.string().trim().min(1).max(80),
  }).superRefine((value, context) => {
    if (value.tradition === "other" && !value.customTradition.trim()) {
      context.addIssue({
        code: "custom",
        path: ["customTradition"],
        message: "Enter your church tradition",
      });
    }
  }),
});

type ChurchFormValues = z.infer<typeof churchFormSchema>;
const SPIRITUAL_GIFTS = [
  ["Administration", "organizing people, resources, and systems effectively"], ["Apostleship", "pioneering, starting, expanding, and establishing new ministries or works"], ["Discernment of Spirits", "recognizing what is from God, human influence, or spiritual deception"], ["Evangelism", "communicating the gospel and helping people respond to Jesus"], ["Exhortation / Encouragement", "strengthening, motivating, comforting, and challenging others"], ["Faith", "unusual confidence in God’s power, promises, and provision"], ["Giving", "generously and joyfully sharing resources to advance God’s work and meet needs"], ["Healing", "being used by God as an instrument of physical, emotional, or spiritual healing"], ["Helps / Service", "meeting practical needs and supporting others so ministry can happen"], ["Hospitality", "welcoming people and creating environments where others feel received and cared for"], ["Interpretation of Tongues", "interpreting a message spoken in tongues"], ["Knowledge", "understanding and communicating spiritual truth or insight"], ["Leadership", "providing direction, motivating others, and helping a group move toward God-given goals"], ["Mercy", "compassionately caring for people who are hurting, struggling, marginalized, or in need"], ["Miracles", "being used by God in extraordinary demonstrations of His power"], ["Pastoring / Shepherding", "caring for, protecting, guiding, and nurturing people spiritually"], ["Prophecy", "communicating a message believed to be prompted by God for strengthening, correction, encouragement, or direction"], ["Teaching", "explaining and applying biblical truth so others understand and grow"], ["Tongues", "speaking in a language or spiritual utterance given through the Holy Spirit"], ["Wisdom", "applying spiritual truth appropriately to real situations"], ["Craftsmanship", "using artistic or practical skill for God’s purposes"], ["Intercession", "persistent, focused prayer for others"], ["Missionary / Cross-Cultural Ministry", "effectively ministering across cultures and communities"], ["Music / Worship", "using musical ability to lead and encourage worship"], ["Celibacy", "a particular grace for remaining unmarried for undivided devotion to ministry"], ["Voluntary Poverty", "willingly living with less in order to serve God and others"],
] as const;
const ALL_GIFT_NAMES = SPIRITUAL_GIFTS.map(([name]) => name);
const SPIRITUAL_GIFT_DEPTH_OPTIONS = [
  {
    value: 1,
    label: "Extra light",
    summary: "1 question per gift",
    description: "Fastest option, with the broadest and least precise signal.",
  },
  {
    value: 2,
    label: "Light",
    summary: "2 questions per gift",
    description: "A shorter reflection with a more balanced signal.",
  },
  {
    value: 3,
    label: "Heavy",
    summary: "3 questions per gift",
    description: "The current depth, with stronger confidence from more reflection.",
  },
  {
    value: 4,
    label: "Extra heavy",
    summary: "4 questions per gift",
    description: "The most thorough option and the fullest, most precise signal.",
  },
] as const;
const MINISTRY_DEPTH_OPTIONS = [
  {
    value: 1,
    label: "Extra light",
    summary: "1 question per tag",
    description: "Fastest option, with the broadest and least precise signal.",
  },
  {
    value: 2,
    label: "Light",
    summary: "2 questions per tag",
    description: "A shorter reflection with a more balanced signal.",
  },
  {
    value: 3,
    label: "Heavy",
    summary: "3 questions per tag",
    description: "The current depth, with stronger confidence from more reflection.",
  },
  {
    value: 4,
    label: "Extra heavy",
    summary: "4 questions per tag",
    description: "The most thorough option and the fullest, most precise signal.",
  },
] as const;
const ESTIMATE_SECONDS_PER_REFLECTION = 10;

function estimateAssessmentTime(
  values: Pick<ChurchFormValues, "enabledSpiritualGifts" | "assessmentConfiguration">,
) {
  const { sections, subsections, spiritualGiftQuestionCount, ministryQuestionCount } =
    values.assessmentConfiguration;
  const subsectionEnabled = (key: keyof AssessmentConfigurationSubsections) =>
    subsections[key];
  let seconds = 60; // Required identity details.
  let reflectionQuestions = 0;

  if (sections.aboutYou) {
    if (subsectionEnabled("aboutYou.phone")) seconds += 15;
    if (subsectionEnabled("aboutYou.preferredContact")) seconds += 10;
    if (subsectionEnabled("aboutYou.familySituation")) seconds += 10;
    if (subsectionEnabled("aboutYou.transportation")) seconds += 10;
    if (subsectionEnabled("aboutYou.languages")) seconds += 30;
    if (subsectionEnabled("aboutYou.profilePhoto")) seconds += 30;
    if (subsectionEnabled("aboutYou.skillsExperience")) seconds += 150;
    if (subsectionEnabled("aboutYou.lifeExperiences")) seconds += 90;
  }

  if (sections.apest) {
    const enabledApproaches = [
      "apest.builder",
      "apest.insight",
      "apest.connector",
      "apest.caregiver",
      "apest.teacher",
    ] as const;
    const count = enabledApproaches.filter((key) => subsectionEnabled(key)).length;
    reflectionQuestions += count * ministryQuestionCount;
  }

  if (sections.spiritualGifts) {
    reflectionQuestions += values.enabledSpiritualGifts.length * spiritualGiftQuestionCount;
  }

  if (sections.passionsInterests) {
    if (subsectionEnabled("passionsInterests.passions")) seconds += 60;
    if (subsectionEnabled("passionsInterests.ministryInterests")) seconds += 60;
  }

  if (sections.naturalStrengths) {
    const strengthKeys = [
      "naturalStrengths.relationalConnection",
      "naturalStrengths.encouragement",
      "naturalStrengths.teachingExplaining",
      "naturalStrengths.listening",
      "naturalStrengths.leadershipInitiative",
      "naturalStrengths.organizing",
      "naturalStrengths.creativeExpression",
      "naturalStrengths.problemSolving",
      "naturalStrengths.practicalHandsOn",
      "naturalStrengths.hospitality",
      "naturalStrengths.compassionCare",
      "naturalStrengths.communicationStorytelling",
      "naturalStrengths.discernment",
      "naturalStrengths.followThrough",
      "naturalStrengths.adaptability",
      "naturalStrengths.mentoringDevelopment",
      "naturalStrengths.strategicThinking",
      "naturalStrengths.advocacyJustice",
    ] as const;
    reflectionQuestions += strengthKeys.filter((key) => subsectionEnabled(key)).length * 3;
  }

  if (sections.personalityStrengths) {
    const personalityKeys = [
      "personalityStrengths.socialEnergy",
      "personalityStrengths.decisionLens",
      "personalityStrengths.planningStyle",
      "personalityStrengths.focusStyle",
      "personalityStrengths.actionStyle",
      "personalityStrengths.pacePreference",
      "personalityStrengths.workStyle",
    ] as const;
    reflectionQuestions += personalityKeys.filter((key) => subsectionEnabled(key)).length * 3;
    if (subsectionEnabled("personalityStrengths.ministryPreferences")) seconds += 90;
  }

  if (sections.spiritualHealth) {
    const spiritualHealthKeys = [
      "spiritualHealth.prayer",
      "spiritualHealth.scripture",
      "spiritualHealth.worship",
      "spiritualHealth.relationships",
      "spiritualHealth.community",
      "spiritualHealth.rest",
      "spiritualHealth.motivation",
      "spiritualHealth.wellbeing",
      "spiritualHealth.connection",
    ] as const;
    seconds += spiritualHealthKeys.filter((key) => subsectionEnabled(key)).length * 45;
  }

  if (sections.connectionAvailability) {
    if (subsectionEnabled("connectionAvailability.churchConnection")) seconds += 120;
    if (subsectionEnabled("connectionAvailability.availability")) seconds += 150;
  }

  seconds += reflectionQuestions * ESTIMATE_SECONDS_PER_REFLECTION;
  const typicalMinutes = seconds / 60;
  return {
    minimum: Math.max(1, Math.round(typicalMinutes * 0.8)),
    maximum: Math.max(1, Math.ceil(typicalMinutes * 1.2)),
    reflectionQuestions,
  };
}
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const DISCOVER_HALLWAY_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;
const DISCOVER_HALLWAY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const DEFAULT_SECTIONS: AssessmentConfigurationSections = {
  aboutYou: true,
  apest: true,
  spiritualGifts: true,
  passionsInterests: true,
  naturalStrengths: true,
  personalityStrengths: true,
  spiritualHealth: true,
  connectionAvailability: true,
};

const DEFAULT_SUBSECTIONS: AssessmentConfigurationSubsections = {
  'aboutYou.personalInformation': true,
  'aboutYou.phone': true,
  'aboutYou.preferredContact': true,
  'aboutYou.familySituation': true,
  'aboutYou.transportation': true,
  'aboutYou.languages': true,
  'aboutYou.profilePhoto': true,
  'aboutYou.skillsExperience': true,
  'aboutYou.lifeExperiences': true,
  'apest.builder': true,
  'apest.insight': true,
  'apest.connector': true,
  'apest.caregiver': true,
  'apest.teacher': true,
  'passionsInterests.passions': true,
  'passionsInterests.ministryInterests': true,
  'naturalStrengths.relationalConnection': true,
  'naturalStrengths.encouragement': true,
  'naturalStrengths.teachingExplaining': true,
  'naturalStrengths.listening': true,
  'naturalStrengths.leadershipInitiative': true,
  'naturalStrengths.organizing': true,
  'naturalStrengths.creativeExpression': true,
  'naturalStrengths.problemSolving': true,
  'naturalStrengths.practicalHandsOn': true,
  'naturalStrengths.hospitality': true,
  'naturalStrengths.compassionCare': true,
  'naturalStrengths.communicationStorytelling': true,
  'naturalStrengths.discernment': true,
  'naturalStrengths.followThrough': true,
  'naturalStrengths.adaptability': true,
  'naturalStrengths.mentoringDevelopment': true,
  'naturalStrengths.strategicThinking': true,
  'naturalStrengths.advocacyJustice': true,
  'personalityStrengths.socialEnergy': true,
  'personalityStrengths.decisionLens': true,
  'personalityStrengths.planningStyle': true,
  'personalityStrengths.focusStyle': true,
  'personalityStrengths.actionStyle': true,
  'personalityStrengths.pacePreference': true,
  'personalityStrengths.workStyle': true,
  'personalityStrengths.ministryPreferences': true,
  'spiritualHealth.prayer': true,
  'spiritualHealth.scripture': true,
  'spiritualHealth.worship': true,
  'spiritualHealth.relationships': true,
  'spiritualHealth.community': true,
  'spiritualHealth.rest': true,
  'spiritualHealth.motivation': true,
  'spiritualHealth.wellbeing': true,
  'spiritualHealth.connection': true,
  'connectionAvailability.churchConnection': true,
  'connectionAvailability.availability': true,
};

type SectionKey = keyof AssessmentConfigurationSections;
type SubsectionKey = keyof AssessmentConfigurationSubsections;

interface ConfigDef {
  key: SectionKey;
  label: string;
  description: string;
  subsections?: Array<{
    key: SubsectionKey;
    label: string;
    tag?: string;
    description?: string;
  }>;
}

const CONFIG_SECTIONS: ConfigDef[] = [
  {
    key: "aboutYou",
    label: "About You",
    description: "Choose which personal details, skills, and experiences members can share.",
    subsections: [
      { key: "aboutYou.phone", label: "Phone number", description: "Optional phone number for church follow-up." },
      { key: "aboutYou.preferredContact", label: "Preferred contact method", description: "Email, phone, or text." },
      { key: "aboutYou.familySituation", label: "Family situation" },
      { key: "aboutYou.transportation", label: "Transportation" },
      { key: "aboutYou.languages", label: "Languages and proficiency" },
      { key: "aboutYou.profilePhoto", label: "Profile photo" },
      { key: "aboutYou.skillsExperience", label: "Skills & Experience", description: "Occupational background and past ministry involvement." },
      { key: "aboutYou.lifeExperiences", label: "Experiences That Have Shaped You", description: "An optional open reflection; members choose what, if anything, to share." }
    ]
  },
  {
    key: "connectionAvailability",
    label: "Church Connection & Availability",
    description: "Understand how members are connected to the church and when they can serve.",
    subsections: [
      { key: "connectionAvailability.churchConnection", label: "Church Connection", description: "Length of attendance and engagement level." },
      { key: "connectionAvailability.availability", label: "Availability", description: "General capacity and preferred times to serve." }
    ]
  },
  {
    key: "spiritualGifts",
    label: "Spiritual Gifts",
    description: "Identify biblical gifts and empowerments for ministry.",
  },
  {
    key: "apest",
    label: "How You Minister",
    description: "Reflect on the ways people tend to contribute, connect, care, and help others grow.",
    subsections: [
      { key: "apest.builder", tag: "Apostle", label: "Starting and building new ministry" },
      { key: "apest.insight", tag: "Prophet", label: "Noticing what needs attention" },
      { key: "apest.connector", tag: "Evangelist", label: "Connecting people with faith" },
      { key: "apest.caregiver", tag: "Shepherd", label: "Caring for people over time" },
      { key: "apest.teacher", tag: "Teacher", label: "Making ideas clear" }
    ]
  },
  {
    key: "passionsInterests",
    label: "Passions & Interests",
    description: "What causes and ministry areas people care most about.",
    subsections: [
      { key: "passionsInterests.passions", label: "Passions", description: "Causes, age groups, and demographics." },
      { key: "passionsInterests.ministryInterests", label: "Ministry Interests", description: "Specific roles or teams they want to explore." }
    ]
  },
  {
    key: "naturalStrengths",
    label: "Natural Strengths",
    description: "Inherent abilities and talents they bring to a team.",
    subsections: [
      { key: "naturalStrengths.relationalConnection", label: "Relational Connection" },
      { key: "naturalStrengths.encouragement", label: "Encouragement" },
      { key: "naturalStrengths.teachingExplaining", label: "Teaching & Explaining" },
      { key: "naturalStrengths.listening", label: "Listening" },
      { key: "naturalStrengths.leadershipInitiative", label: "Leadership & Initiative" },
      { key: "naturalStrengths.organizing", label: "Organizing" },
      { key: "naturalStrengths.creativeExpression", label: "Creative Expression" },
      { key: "naturalStrengths.problemSolving", label: "Problem Solving" },
      { key: "naturalStrengths.practicalHandsOn", label: "Practical & Hands-On" },
      { key: "naturalStrengths.hospitality", label: "Hospitality" },
      { key: "naturalStrengths.compassionCare", label: "Compassion & Care" },
      { key: "naturalStrengths.communicationStorytelling", label: "Communication & Storytelling" },
      { key: "naturalStrengths.discernment", label: "Discernment" },
      { key: "naturalStrengths.followThrough", label: "Follow-Through" },
      { key: "naturalStrengths.adaptability", label: "Adaptability" },
      { key: "naturalStrengths.mentoringDevelopment", label: "Mentoring & Development" },
      { key: "naturalStrengths.strategicThinking", label: "Strategic Thinking" },
      { key: "naturalStrengths.advocacyJustice", label: "Advocacy & Justice" }
    ]
  },
  {
    key: "personalityStrengths",
    label: "Personality & Working Style",
    description: "How people interact, plan, and approach their work.",
    subsections: [
      { key: "personalityStrengths.socialEnergy", label: "Social Energy", description: "Extroversion vs. Introversion" },
      { key: "personalityStrengths.decisionLens", label: "Decision Lens", description: "Logic vs. Empathy" },
      { key: "personalityStrengths.planningStyle", label: "Planning Style", description: "Structured vs. Spontaneous" },
      { key: "personalityStrengths.focusStyle", label: "Focus Style", description: "Big Picture vs. Details" },
      { key: "personalityStrengths.actionStyle", label: "Action Style", description: "Initiator vs. Responder" },
      { key: "personalityStrengths.pacePreference", label: "Pace Preference", description: "Fast-Paced vs. Steady" },
      { key: "personalityStrengths.workStyle", label: "Work Style", description: "Independent vs. Collaborative" },
      { key: "personalityStrengths.ministryPreferences", label: "Ministry Preferences", description: "Behind-the-scenes vs. Upfront" }
    ]
  },
  {
    key: "spiritualHealth",
    label: "Spiritual Health & Rhythms",
    description: "Self-reflection on current spiritual practices and wellbeing.",
    subsections: [
      { key: "spiritualHealth.prayer", label: "Prayer" },
      { key: "spiritualHealth.scripture", label: "Scripture Engagement" },
      { key: "spiritualHealth.worship", label: "Worship" },
      { key: "spiritualHealth.relationships", label: "Relationships" },
      { key: "spiritualHealth.community", label: "Community" },
      { key: "spiritualHealth.rest", label: "Rest & Sabbath" },
      { key: "spiritualHealth.motivation", label: "Motivation" },
      { key: "spiritualHealth.wellbeing", label: "Wellbeing" },
      { key: "spiritualHealth.connection", label: "Connection to God" }
    ]
  }
];

function contrastTextColor(hex: string) {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
  const [red, green, blue] = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  const whiteContrast = 1.05 / (luminance + 0.05);
  const darkContrast = (luminance + 0.05) / 0.055;
  return whiteContrast >= darkContrast ? "#FFFFFF" : "#0B1220";
}

function savedLogoSource(path: string | null | undefined, slug: string | undefined) {
  const version = path?.split("/").at(-1);
  return path && slug
    ? `/api/churches/${slug}/logo?v=${encodeURIComponent(version || "")}`
    : null;
}

function publicProfilePath(slug: string) {
  return `/profile/${encodeURIComponent(slug)}`;
}

function publicProfileUrl(slug: string) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${window.location.origin}${basePath}${publicProfilePath(slug)}`;
}

function generateDiscoverHallwayCode() {
  return Array.from({ length: 6 }, () =>
    DISCOVER_HALLWAY_CODE_ALPHABET[Math.floor(Math.random() * DISCOVER_HALLWAY_CODE_ALPHABET.length)],
  ).join("");
}

export default function ChurchSetup() {
  const {
    data: church,
    isLoading,
    isFetching,
    refetch: refetchChurch,
    isPending: churchPending,
    isError: churchError,
  } = useGetMyChurch({
    query: {
      queryKey: getGetMyChurchQueryKey(),
      retry: 3,
      retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4_000),
    },
  });
  const { data: admins, isLoading: adminsLoading } = useListChurchAdmins();
  const updateChurch = useUpdateMyChurch();
  const updateBranding = useUpdateMyChurch();
  const updateDiscoverCode = useUpdateMyChurch();
  const updateIntegratedPilot = useUpdateMyChurch();
  const addAdmin = useAddChurchAdmin();
  const removeAdmin = useRemoveChurchAdmin();
  const queryClient = useQueryClient();
  const initializedForId = useRef<number | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [localLogoPreview, setLocalLogoPreview] = useState<string | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [adminEmailDraft, setAdminEmailDraft] = useState("");
  const [discoverCodeDraft, setDiscoverCodeDraft] = useState("");
  const [pilotEnabled, setPilotEnabled] = useState(false);
  const [pilotSaveError, setPilotSaveError] = useState("");
  const [spiritualGiftsExpanded, setSpiritualGiftsExpanded] = useState(false);
  const [assessmentSectionsExpanded, setAssessmentSectionsExpanded] = useState<Record<string, boolean>>({});
  const [setupTab, setSetupTab] = useState<"church" | "assessment">("church");
  const [editingYouthProfile, setEditingYouthProfile] = useState<"discover" | "explore" | "develop" | null>(null);

  const form = useForm<ChurchFormValues>({
    resolver: zodResolver(churchFormSchema),
    defaultValues: {
      name: "",
      adminName: "",
      adminEmail: "",
      website: "",
      address: "",
      primaryColor: "#122344",
      accentColor: "#ED7A59",
      enabledSpiritualGifts: ALL_GIFT_NAMES,
      assessmentConfiguration: {
        sections: DEFAULT_SECTIONS,
        subsections: DEFAULT_SUBSECTIONS,
        spiritualGiftQuestionCount: 3,
        ministryQuestionCount: 3,
        passions: [...GENERIC_PASSIONS],
        ministryInterests: [...GENERIC_MINISTRY_INTERESTS],
      },
      ministryCustomization: {
        ...DEFAULT_MINISTRY_CUSTOMIZATION,
        customTradition: "",
      },
    },
  });

  useEffect(() => {
    if (church && initializedForId.current !== church.id) {
      initializedForId.current = church.id;

      setPilotEnabled(church.integratedAssessmentPilotEnabled ?? false);

      const mergedSections = { ...DEFAULT_SECTIONS, ...(church.assessmentConfiguration?.sections || {}) };
      const mergedSubsections = { ...DEFAULT_SUBSECTIONS, ...(church.assessmentConfiguration?.subsections || {}) };

      form.reset({
        name: church.name,
        adminName: church.adminName,
        adminEmail: church.adminEmail,
        website: church.website || "",
        address: church.address || "",
        primaryColor: church.primaryColor,
        accentColor: church.accentColor,
        enabledSpiritualGifts: church.enabledSpiritualGifts || ALL_GIFT_NAMES,
        assessmentConfiguration: {
          sections: mergedSections,
          subsections: mergedSubsections,
          spiritualGiftQuestionCount:
            church.assessmentConfiguration?.spiritualGiftQuestionCount ?? 3,
          ministryQuestionCount:
            church.assessmentConfiguration?.ministryQuestionCount ?? 3,
          passions: church.assessmentConfiguration?.passions || [...GENERIC_PASSIONS],
          ministryInterests: church.assessmentConfiguration?.ministryInterests || [...GENERIC_MINISTRY_INTERESTS],
          youthProfiles: church.assessmentConfiguration?.youthProfiles,
        },
        ministryCustomization: {
          ...church.ministryCustomization,
          customTradition: church.ministryCustomization.customTradition || "",
        },
      });
      setLogoPath(church.logoUrl || null);
      setDiscoverCodeDraft(church.discoverHallwayCode || "");
    }
  }, [church, form]);

  useEffect(
    () => () => {
      if (localLogoPreview) URL.revokeObjectURL(localLogoPreview);
    },
    [localLogoPreview],
  );

  const onSubmit = (data: ChurchFormValues) => {
    // Nullify empty strings
    const payload = {
      ...data,
      website: data.website || null,
      address: data.address || null,
      logoUrl: logoPath,
      enabledSpiritualGifts: data.enabledSpiritualGifts as SpiritualGiftName[],
      ministryCustomization: {
        ...data.ministryCustomization,
        customTradition:
          data.ministryCustomization.tradition === "other"
            ? data.ministryCustomization.customTradition.trim()
            : null,
      } as MinistryCustomization,
    };

    updateChurch.mutate(
      { data: payload },
      {
        onSuccess: (updatedChurch) => {
          toast({
            title: "Church details updated",
            description: "Your settings have been saved successfully.",
          });
          queryClient.setQueryData(getGetMyChurchQueryKey(), updatedChurch);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update church details. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleAddAdmin = () => {
    const email = adminEmailDraft.trim();
    if (!email) return;
    addAdmin.mutate(
      { data: { email } },
      {
        onSuccess: (admin) => {
          setAdminEmailDraft("");
          queryClient.setQueryData(
            getListChurchAdminsQueryKey(),
            (current: ChurchAdmin[] | undefined) => [...(current ?? []), admin],
          );
          toast({
            title: "Pastor added",
            description: `${admin.name} can now manage this church.`,
          });
        },
        onError: () => {
          toast({
            title: "Could not add pastor",
            description: "Check that they already have an Every Part account, then try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const saveDiscoverCode = () => {
    const code = discoverCodeDraft.trim().toUpperCase();
    if (!DISCOVER_HALLWAY_CODE_PATTERN.test(code)) return;
    updateDiscoverCode.mutate(
      { data: { discoverHallwayCode: code } },
      {
        onSuccess: (updatedChurch) => {
          setDiscoverCodeDraft(updatedChurch.discoverHallwayCode || "");
          queryClient.setQueryData(getGetMyChurchQueryKey(), updatedChurch);
          toast({
            title: "Discover code saved",
            description: "Visitors can now use this code to open Discover.",
          });
        },
        onError: () => {
          toast({
            title: "Could not save Discover code",
            description: "Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const saveIntegratedPilot = () => {
    setPilotSaveError("");
    updateIntegratedPilot.mutate(
      { data: { integratedAssessmentPilotEnabled: pilotEnabled } },
      {
        onSuccess: (updatedChurch) => {
          queryClient.setQueryData(getGetMyChurchQueryKey(), updatedChurch);
          setPilotEnabled(updatedChurch.integratedAssessmentPilotEnabled ?? false);
          toast({
            title: "Adult pilot settings saved",
            description: updatedChurch.integratedAssessmentPilotEnabled ? "Adults may now start the integrated pilot. Standard assessments remain available." : "New pilot starts are disabled. Existing drafts can still resume and finish.",
          });
        },
        onError: () => {
          setPilotSaveError("The pilot setting was not saved. Your selection is still shown; retry to apply it.");
          toast({
            title: "Could not save pilot settings",
            description: "Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleRemoveAdmin = (id: number) => {
    removeAdmin.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.setQueryData(
            getListChurchAdminsQueryKey(),
            (current: ChurchAdmin[] | undefined) =>
              (current ?? []).filter((admin) => admin.id !== id),
          );
          toast({
            title: "Pastor access removed",
            description: "They no longer have access to this church.",
          });
        },
        onError: () => {
          toast({
            title: "Could not remove pastor",
            description: "The church owner cannot be removed.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const [passionDraft, setPassionDraft] = useState("");
  const [interestDraft, setInterestDraft] = useState("");
  const addCustomOption = (field: "passions" | "ministryInterests", draft: string, clear: () => void) => {
    const value = draft.trim();
    const current = form.getValues(`assessmentConfiguration.${field}`);
    if (!value || current.some(option => option.toLocaleLowerCase() === value.toLocaleLowerCase())) return;
    form.setValue(`assessmentConfiguration.${field}`, [...current, value], { shouldDirty: true });
    clear();
  };
  const removeCustomOption = (field: "passions" | "ministryInterests", value: string) => {
    if ((field === "passions" ? GENERIC_PASSIONS : GENERIC_MINISTRY_INTERESTS).includes(value as never)) return;
    const current = form.getValues(`assessmentConfiguration.${field}`);
    form.setValue(`assessmentConfiguration.${field}`, current.filter(option => option !== value), { shouldDirty: true });
  };

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_LOGO_TYPES.has(file.type) || file.size > MAX_LOGO_SIZE) {
      toast({
        title: "Logo not uploaded",
        description: "Choose a PNG, JPG, or WebP image under 5 MB.",
        variant: "destructive",
      });
      if (logoInputRef.current) logoInputRef.current.value = "";
      return;
    }

    setIsLogoUploading(true);
    try {
      const upload = await requestUploadUrl({
        name: file.name,
        size: file.size,
        contentType: file.type as UploadUrlRequestContentType,
      });
      const response = await fetch(upload.uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Upload failed");
      if (localLogoPreview) URL.revokeObjectURL(localLogoPreview);
      setLocalLogoPreview(URL.createObjectURL(file));
      setLogoPath(upload.objectPath);
      toast({
        title: "Logo uploaded",
        description: "Save changes to publish it on your assessment.",
      });
    } catch {
      toast({
        title: "Logo not uploaded",
        description: "The image could not be uploaded. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const saveBranding = () => {
    const primaryColor = form.getValues("primaryColor");
    const accentColor = form.getValues("accentColor");
    const colorPattern = /^#[0-9A-Fa-f]{6}$/;

    if (!colorPattern.test(primaryColor) || !colorPattern.test(accentColor)) {
      toast({
        title: "Check your colors",
        description: "Use a 6-digit hex color such as #122344.",
        variant: "destructive",
      });
      return;
    }

    updateBranding.mutate(
      {
        data: {
          logoUrl: logoPath,
          primaryColor,
          accentColor,
        },
      },
      {
        onSuccess: (updatedChurch) => {
          queryClient.setQueryData(getGetMyChurchQueryKey(), updatedChurch);
          void queryClient.invalidateQueries({
            queryKey: getGetPublicChurchQueryKey(updatedChurch.slug),
          });
          setLogoPath(updatedChurch.logoUrl || null);
          if (localLogoPreview) {
            URL.revokeObjectURL(localLogoPreview);
            setLocalLogoPreview(null);
          }
          toast({
            title: "Branding saved",
            description: "Your church logo and colors are now saved.",
          });
        },
        onError: () => {
          toast({
            title: "Branding not saved",
            description: "We could not save your logo and colors. Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const copyToClipboard = () => {
    if (!church?.slug) return;
    navigator.clipboard.writeText(publicProfileUrl(church.slug));
    toast({
      title: "Copied to clipboard",
      description: "Assessment link copied!",
    });
  };

  const primaryColor = form.watch("primaryColor");
  const accentColor = form.watch("accentColor");
  const customizationMode = form.watch("ministryCustomization.mode");
  const churchTradition = form.watch("ministryCustomization.tradition");
  const spiritualGiftsLabel = form.watch(
    "ministryCustomization.spiritualGiftsLabel",
  );
  const ministryInterestsLabel = form.watch(
    "ministryCustomization.ministryInterestsLabel",
  );
  const assessmentConfiguration = form.watch("assessmentConfiguration");
  const youthProfiles = assessmentConfiguration.youthProfiles as Record<string, any> | undefined;
  const liveYouthSectionKeys = editingYouthProfile === "develop"
    ? []
    : Object.keys(youthProfiles?.[editingYouthProfile || "discover"]?.sections || {});
  const liveYouthChoicePrefixes = editingYouthProfile === "discover"
    ? ["caringAndHelping.", "growingWithJesus.", "opportunities."]
    : editingYouthProfile === "explore"
      ? ["aboutMe.", "peopleAndNeeds.", "waysIEnjoyHelping.", "growingWithJesus."]
      : ["ministryInterests."];
  const formatYouthKey = (key: string) =>
    key
      .replace(/^.*\./, "")
      .replace(/([A-Z])/g, " $1")
      .replace(/[-_]/g, " ")
      .replace(/^./, (letter) => letter.toUpperCase());
  const assessmentEstimate = estimateAssessmentTime({
    enabledSpiritualGifts: form.watch("enabledSpiritualGifts"),
    assessmentConfiguration,
  });
  const enabledSectionCount = Object.values(assessmentConfiguration.sections).filter(Boolean).length;
  const enabledGiftCount = form.watch("enabledSpiritualGifts").length;

  const churchLoadFailed = !church && (churchError || (!churchPending && !isLoading));

  if (churchLoadFailed) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Card className="border-destructive/30 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              We couldn’t load your church setup
            </CardTitle>
            <CardDescription>
              Your saved church details are still safe. Retry to load the setup
              page and sharing link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              type="button"
              onClick={() => void refetchChurch()}
              disabled={isFetching}
            >
              {isFetching ? "Retrying..." : "Retry"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !church) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const logoUrl = logoPath;
  const logoPreview = localLogoPreview || savedLogoSource(logoUrl, church.slug);
  const assessmentPath = publicProfilePath(church.slug);
  const assessmentUrl = publicProfileUrl(church.slug);

  const setCustomizationLabels = (
    labels: Pick<
      MinistryCustomization,
      "spiritualGiftsLabel" | "ministryInterestsLabel"
    >,
  ) => {
    form.setValue(
      "ministryCustomization.spiritualGiftsLabel",
      labels.spiritualGiftsLabel,
      { shouldDirty: true },
    );
    form.setValue(
      "ministryCustomization.ministryInterestsLabel",
      labels.ministryInterestsLabel,
      { shouldDirty: true },
    );
  };

  const changeCustomizationMode = (mode: MinistryCustomizationMode) => {
    form.setValue("ministryCustomization.mode", mode, { shouldDirty: true });
    if (mode === "standard") {
      setCustomizationLabels(STANDARD_MINISTRY_LABELS);
      form.setValue("enabledSpiritualGifts", [...ALL_GIFT_NAMES], {
        shouldDirty: true,
      });
    } else if (mode === "tradition") {
      setCustomizationLabels(recommendedMinistryLabels(churchTradition));
      form.setValue(
        "enabledSpiritualGifts",
        recommendedSpiritualGifts(churchTradition, ALL_GIFT_NAMES),
        { shouldDirty: true },
      );
    }
  };

  const changeTradition = (tradition: MinistryCustomizationTradition) => {
    form.setValue("ministryCustomization.tradition", tradition, {
      shouldDirty: true,
    });
    if (customizationMode === "tradition") {
      setCustomizationLabels(recommendedMinistryLabels(tradition));
      form.setValue(
        "enabledSpiritualGifts",
        recommendedSpiritualGifts(tradition, ALL_GIFT_NAMES),
        { shouldDirty: true },
      );
    }
  };

  return (
    <div className="church-setup-page container mx-auto max-w-5xl space-y-6 px-4 py-8 sm:space-y-8 sm:py-10">
      <div className="church-setup-header">
        <p className="church-setup-eyebrow">Every Part / Church profile</p>
        <h1 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">Church Setup</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Manage what your congregation sees, then share the profile link when you&apos;re ready.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-sm text-muted-foreground" aria-label="Assessment summary">
          <span className="church-setup-summary-pill">
            {enabledSectionCount} {enabledSectionCount === 1 ? "section" : "sections"} enabled
          </span>
          <span className="church-setup-summary-pill">{enabledGiftCount} spiritual gifts included</span>
          <span className="church-setup-summary-pill">
            {assessmentEstimate.minimum}–{assessmentEstimate.maximum} min estimated
          </span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="church-setup-form space-y-8">
          <Tabs
            value={setupTab}
            onValueChange={(value) => setSetupTab(value as "church" | "assessment")}
            className="church-setup-tabs space-y-6"
          >
            <TabsList
              className="church-setup-tabs-list grid h-auto w-full grid-cols-2 gap-2 p-0 sm:max-w-2xl"
              aria-label="Setup area"
            >
              <TabsTrigger
                id="setup-tab-church"
                value="church"
                className="church-setup-tab-trigger h-auto min-h-16 flex-col items-start gap-1 px-4 py-3 text-left sm:items-center sm:text-center"
              >
                <span>Church Setup</span>
                <span className="church-setup-tab-subtitle text-xs font-normal text-muted-foreground">
                  Details, access, and sharing
                </span>
              </TabsTrigger>
              <TabsTrigger
                id="setup-tab-assessment"
                value="assessment"
                className="church-setup-tab-trigger h-auto min-h-16 flex-col items-start gap-1 px-4 py-3 text-left sm:items-center sm:text-center"
              >
                <span>Assessment Setup</span>
                <span className="church-setup-tab-subtitle text-xs font-normal text-muted-foreground">
                  Questions and reflection
                </span>
              </TabsTrigger>
            </TabsList>

            <div
              role="tabpanel"
              id={`setup-panel-${setupTab}`}
              aria-labelledby={`setup-tab-${setupTab}`}
              tabIndex={0}
              className="space-y-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
            <div className={setupTab === "church" ? "space-y-8" : "hidden"}>
      <Card className="church-setup-link-card border-primary/20 bg-primary/5 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-primary">Your Assessment Link</CardTitle>
          <CardDescription className="text-primary/70">
            Share this link with your congregation to gather profiles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-background border border-primary/20 p-2 rounded-md">
            <div className="flex-1 truncate font-mono text-sm px-2 text-muted-foreground">
              {assessmentUrl}
            </div>
            <Button variant="secondary" size="sm" onClick={copyToClipboard} className="shrink-0">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <a href={assessmentPath} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="church-setup-section-card border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-xl">
            <UsersRound className="h-5 w-5 text-primary" />
            Discover hallway code
          </CardTitle>
          <CardDescription>
            Let families open Discover for ages 6–8 without signing in. Share this short code in a church hallway or family handout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={discoverCodeDraft}
              onChange={(event) =>
                setDiscoverCodeDraft(
                  event.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 6),
                )
              }
              placeholder="6-character code"
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={6}
              aria-label="Discover hallway code"
              className="font-mono tracking-[0.25em]"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setDiscoverCodeDraft(generateDiscoverHallwayCode())}
              className="shrink-0"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate new
            </Button>
            <Button
              type="button"
              onClick={saveDiscoverCode}
              disabled={
                updateDiscoverCode.isPending ||
                !DISCOVER_HALLWAY_CODE_PATTERN.test(discoverCodeDraft)
              }
              className="shrink-0"
            >
              {updateDiscoverCode.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save code
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Current code: <span className="font-mono font-semibold tracking-[0.2em]">{church?.discoverHallwayCode || "Not set"}</span>.
            Generating and saving a new code immediately replaces the old one.
          </p>
        </CardContent>
      </Card>

      <Card className="church-setup-section-card border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-xl">
            <UsersRound className="h-5 w-5 text-primary" />
            Pastor admins
          </CardTitle>
          <CardDescription>
            Give other pastors access to this church's profiles, teams, and setup. They must have an Every Part account first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              value={adminEmailDraft}
              onChange={(event) => setAdminEmailDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddAdmin();
                }
              }}
              placeholder="pastor@example.com"
              aria-label="Pastor email"
            />
            <Button
              type="button"
              onClick={handleAddAdmin}
              disabled={addAdmin.isPending || !adminEmailDraft.trim()}
              className="shrink-0"
            >
              {addAdmin.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Add pastor
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            We look up the email securely through Clerk and never store a password.
          </p>

          {adminsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : admins?.length ? (
            <div className="divide-y rounded-lg border">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{admin.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{admin.email}</p>
                  </div>
                  {admin.role === "owner" ? (
                    <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      Owner
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={removeAdmin.isPending}
                      onClick={() => handleRemoveAdmin(admin.id)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No pastor admins have been added yet.
            </p>
          )}
        </CardContent>
      </Card>

      <ChurchRemovalHistory />

      </div>

      <div className={setupTab === "assessment" ? "space-y-8" : "hidden"}>
          <Card className="church-setup-section-card border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-xl">
                <BookOpenCheck className="h-5 w-5 text-primary" />
                Our Ministry Convictions
              </CardTitle>
              <CardDescription className="max-w-2xl leading-relaxed">
                Every church has unique beliefs, terminology, leadership
                structures, and ministry practices. These settings help Every
                Part reflect your church. Every Part does not determine your
                church&apos;s theology—your church does.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-7">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="ministryCustomization.tradition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tradition or affiliation</FormLabel>
                      <FormDescription>
                        This provides a starting point only. Your church remains
                        in control.
                      </FormDescription>
                      <Select
                        value={field.value}
                        onValueChange={(value) =>
                          changeTradition(
                            value as MinistryCustomizationTradition,
                          )
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a tradition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CHURCH_TRADITIONS.map((tradition) => (
                            <SelectItem
                              key={tradition.value}
                              value={tradition.value}
                            >
                              {tradition.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ministryCustomization.mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customization level</FormLabel>
                      <FormDescription>
                        Choose how Every Part should determine member-facing
                        language.
                      </FormDescription>
                      <Select
                        value={field.value}
                        onValueChange={(value) =>
                          changeCustomizationMode(
                            value as MinistryCustomizationMode,
                          )
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">
                            Every Part Standard
                          </SelectItem>
                          <SelectItem value="tradition">
                            Recommended for our tradition
                          </SelectItem>
                          <SelectItem value="custom">
                            Church Custom
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {churchTradition === "other" && (
                <FormField
                  control={form.control}
                  name="ministryCustomization.customTradition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Church tradition</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your denomination or tradition"
                          maxLength={120}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {customizationMode === "custom" && (
                <div className="grid gap-6 rounded-xl border bg-muted/30 p-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="ministryCustomization.spiritualGiftsLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>God-given abilities terminology</FormLabel>
                        <FormDescription>
                          For example: Spiritual Gifts, Charisms, or Gifts for
                          Service.
                        </FormDescription>
                        <FormControl>
                          <Input {...field} maxLength={80} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ministryCustomization.ministryInterestsLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ministry opportunities terminology</FormLabel>
                        <FormDescription>
                          For example: Ministry Interests, Parish Ministries, or
                          Ways to Serve.
                        </FormDescription>
                        <FormControl>
                          <Input {...field} maxLength={80} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="overflow-hidden rounded-xl border bg-background">
                <div className="flex flex-col gap-3 border-b bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 font-medium">
                      <Eye className="h-4 w-4 text-primary" />
                      See the Ministry Profile as a member
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      These are the labels members will see after you save.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a
                      href={assessmentPath}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open member view
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">
                      Profile section
                    </p>
                    <p className="mt-2 font-serif text-xl">
                      {spiritualGiftsLabel}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">
                      Serving section
                    </p>
                    <p className="mt-2 font-serif text-xl">
                      {ministryInterestsLabel}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="church-setup-section-card border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-serif">Profile experiences</CardTitle>
              <CardDescription>Choose an experience to edit. Identity, age routing, guardian approval, and answer IDs are protected.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {([
                ["adult", "Adult", "Ages 18+", "Your existing Ministry Profile questions"],
                ["discover", "Discover", "Ages 6–8", "Child-friendly discovery with guardian approval"],
                ["explore", "Explore", "Ages 9–12", "Guided exploration with guardian approval"],
                ["develop", "Develop", "Ages 13–17", "Teen reflection with guardian approval"],
              ] as const).map(([key, name, ages, description]) => (
                <div key={key} className="rounded-xl border border-border/60 p-4">
                  <p className="font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">{ages}</p>
                  <p className="mt-2 min-h-10 text-sm text-muted-foreground">{description}</p>
                  <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => {
                    if (key === "adult") {
                      setEditingYouthProfile(null);
                      document.getElementById("adult-assessment-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    } else {
                      setEditingYouthProfile(key);
                      window.setTimeout(() => document.getElementById("youth-profile-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                    }
                  }}>Edit</Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {editingYouthProfile && youthProfiles?.[editingYouthProfile] && (
            <Card id="youth-profile-editor" className="church-setup-section-card border-primary/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-serif">{editingYouthProfile[0].toUpperCase() + editingYouthProfile.slice(1)} profile editor</CardTitle>
                <CardDescription>These edits apply to future submissions only. Answer keys and guardian consent remain unchanged.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  {(["profileTitle", "profileDescription"] as const).map((field) => (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={`youth-${field}`}>{field === "profileTitle" ? "Profile title" : "Profile description"}</Label>
                      <Input id={`youth-${field}`} value={youthProfiles[editingYouthProfile][field]} onChange={(event) => form.setValue(`assessmentConfiguration.youthProfiles.${editingYouthProfile}.${field}` as any, event.target.value, { shouldDirty: true })} />
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {Object.entries(youthProfiles[editingYouthProfile].sections)
                    .filter(([sectionKey]) => liveYouthSectionKeys.includes(sectionKey))
                    .map(([sectionKey, section]: [string, any]) => {
                    const optional = sectionKey === "guardianObservations";
                    return <div key={sectionKey} className="rounded-lg border border-border/60 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div><p className="font-medium">{section.title}</p><p className="text-xs text-muted-foreground">{optional ? "Optional guardian notes" : "Required for safe submissions and results"}</p></div>
                        <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{optional ? "Optional" : "Locked"}</span><Switch checked={section.enabled} disabled={!optional} onCheckedChange={(checked) => form.setValue(`assessmentConfiguration.youthProfiles.${editingYouthProfile}.sections.${sectionKey}.enabled` as any, checked, { shouldDirty: true })} /></div>
                      </div>
                      <div className="grid gap-3">
                        <Input aria-label={`${sectionKey} title`} value={section.title} onChange={(event) => form.setValue(`assessmentConfiguration.youthProfiles.${editingYouthProfile}.sections.${sectionKey}.title` as any, event.target.value, { shouldDirty: true })} />
                      </div>
                    </div>;
                  })}
                </div>
                <div className="space-y-3"><Label>Answer choice wording</Label><p className="text-xs text-muted-foreground">Canonical choices cannot be added, removed, or re-keyed.</p>
                  {Object.entries(youthProfiles[editingYouthProfile].choiceLabels)
                    .filter(([choiceKey]) => liveYouthChoicePrefixes.some((prefix) => choiceKey.startsWith(prefix)))
                    .map(([choiceKey, choiceLabel]: [string, any]) => <div key={choiceKey} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"><Label className="self-center text-xs">{formatYouthKey(choiceKey)}</Label><Input value={choiceLabel} onChange={(event) => form.setValue(`assessmentConfiguration.youthProfiles.${editingYouthProfile}.choiceLabels.${choiceKey}` as any, event.target.value, { shouldDirty: true })} /></div>)}
                </div>
              </CardContent>
            </Card>
          )}

          <Card id="integrated-pilot-editor" className="church-setup-section-card border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-serif">Adult Integrated Pilot</CardTitle>
              <CardDescription>
                Offer adults an integrated reflection in short mixed rounds. Standard adult assessments remain available. Youth pathways are unchanged.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="space-y-1">
                  <Label htmlFor="adult-integrated-pilot" className="text-sm font-medium">Enable integrated assessment pilot</Label>
                  <p className="text-xs text-muted-foreground">Only new starts use this setting. Turning it off never changes an existing draft’s questions or prevents completion.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="adult-integrated-pilot"
                    checked={pilotEnabled}
                    onCheckedChange={setPilotEnabled}
                    disabled={updateIntegratedPilot.isPending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={saveIntegratedPilot}
                    disabled={updateIntegratedPilot.isPending || pilotEnabled === (church?.integratedAssessmentPilotEnabled ?? false)}
                  >
                    {updateIntegratedPilot.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Pilot Setting
                  </Button>
                </div>
              </div>
              {pilotSaveError && <p role="alert" className="text-sm text-destructive">{pilotSaveError}</p>}
            </CardContent>
          </Card>

          <Card id="adult-assessment-editor" className="church-setup-section-card border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-serif">Assessment Content</CardTitle>
              <CardDescription>
                Configure which sections and questions are included in your church's Ministry Profile assessment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Clock3 className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">Expected member completion time</p>
                  <p className="mt-1 font-serif text-2xl text-primary">
                    About {assessmentEstimate.minimum}–{assessmentEstimate.maximum} minutes
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This estimate updates as you enable sections, choose reflection depth,
                    and adjust the gift list. It includes the required identity details and
                    allows extra time for thoughtful responses.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {assessmentEstimate.reflectionQuestions} reflection questions included
                  </p>
                </div>
              </div>

              <div className="flex items-start sm:items-center justify-between gap-4 p-4 bg-muted/40 rounded-lg border border-border/50">
                <div>
                  <h4 className="font-medium text-sm">Identity (Always Included)</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">First name, last name, email, and optional phone are always collected to create the profile.</p>
                </div>
                <Switch checked disabled />
              </div>

              {CONFIG_SECTIONS.map(section => {
                const isEnabled = form.watch(`assessmentConfiguration.sections.${section.key}`);
                return (
                  <Collapsible
                    key={section.key}
                    open={assessmentSectionsExpanded[section.key] ?? false}
                    onOpenChange={(open) =>
                      setAssessmentSectionsExpanded((current) => ({
                        ...current,
                        [section.key]: open,
                      }))
                    }
                    className={`rounded-lg border border-border/50 transition-colors ${isEnabled ? 'bg-card' : 'bg-muted/20 opacity-75'}`}
                  >
                    <div className="flex items-start sm:items-center justify-between gap-4 p-4">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="group flex min-w-0 flex-1 items-start justify-between gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <span className="min-w-0 space-y-1">
                            <span className="block font-medium">{section.label}</span>
                            <span className="block text-sm text-muted-foreground">{section.description}</span>
                          </span>
                          <ChevronDown
                            className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                              assessmentSectionsExpanded[section.key] ? "rotate-180" : ""
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                      </CollapsibleTrigger>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(val) => {
                          form.setValue(`assessmentConfiguration.sections.${section.key}`, val, { shouldDirty: true });
                          if (val) {
                            setAssessmentSectionsExpanded((current) => ({
                              ...current,
                              [section.key]: true,
                            }));
                          }
                          if (section.subsections) {
                            section.subsections.forEach(sub => {
                              form.setValue(`assessmentConfiguration.subsections.${sub.key}` as any, val, { shouldDirty: true });
                            });
                          }
                           if (section.key === "aboutYou") {
                             form.setValue(
                               "assessmentConfiguration.subsections.aboutYou.personalInformation" as any,
                               val,
                               { shouldDirty: true },
                             );
                           }
                        }}
                      />
                    </div>

                    <CollapsibleContent className="space-y-4">
                      {isEnabled && section.subsections && (
                        <div className="p-4 pt-0">
                          <div className="pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                          {section.subsections.map(sub => {
                            return (
                              <FormField
                                key={sub.key}
                                control={form.control}
                                name={`assessmentConfiguration.subsections.${sub.key}`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="flex flex-wrap items-center gap-2 font-normal leading-tight">
                                        {sub.tag && (
                                          <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary">
                                            {sub.tag}
                                          </span>
                                        )}
                                        <span>{sub.label}</span>
                                      </FormLabel>
                                      {sub.description && (
                                        <FormDescription className="text-xs">{sub.description}</FormDescription>
                                      )}
                                    </div>
                                  </FormItem>
                                )}
                              />
                            );
                          })}
                          </div>
                        </div>
                      )}

                      {isEnabled && section.key === "apest" && (
                        <div className="p-4 pt-0">
                          <div className="border-t pt-4">
                          <FormField
                            control={form.control}
                            name="assessmentConfiguration.ministryQuestionCount"
                            render={({ field }) => {
                              const selectedDepth =
                                MINISTRY_DEPTH_OPTIONS.find(
                                  (option) => option.value === field.value,
                                ) ?? MINISTRY_DEPTH_OPTIONS[2];
                              return (
                                <FormItem>
                                  <FormLabel>How You Minister reflection depth</FormLabel>
                                  <FormDescription>
                                    Choose how many questions members answer for each
                                    enabled tag: Apostle, Prophet, Evangelist, Shepherd,
                                    and Teacher. More questions provide a fuller reflection,
                                    but the results remain conversation starters—not fixed
                                    labels or placement decisions.
                                  </FormDescription>
                                  <Select
                                    value={String(field.value)}
                                    onValueChange={(value) =>
                                      field.onChange(Number(value))
                                    }
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Choose a reflection depth" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {MINISTRY_DEPTH_OPTIONS.map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={String(option.value)}
                                        >
                                          {option.label} · {option.summary}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm">
                                    <p className="font-medium">
                                      {selectedDepth.label}: {selectedDepth.summary}
                                    </p>
                                    <p className="mt-1 text-muted-foreground">
                                      {selectedDepth.description}
                                    </p>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                          </div>
                        </div>
                      )}

                      {isEnabled && section.key === "spiritualGifts" && (
                        <div className="p-4 pt-0">
                          <div className="pt-4 border-t space-y-4">
                          <FormField
                            control={form.control}
                            name="assessmentConfiguration.spiritualGiftQuestionCount"
                            render={({ field }) => {
                              const selectedDepth =
                                SPIRITUAL_GIFT_DEPTH_OPTIONS.find(
                                  (option) => option.value === field.value,
                                ) ?? SPIRITUAL_GIFT_DEPTH_OPTIONS[2];
                              return (
                                <FormItem>
                                  <FormLabel>Spiritual gifts reflection depth</FormLabel>
                                  <FormDescription>
                                    Choose how many questions members answer for each enabled gift.
                                    More questions provide a fuller reflection, but the results remain
                                    conversation starters—not diagnoses or placement decisions.
                                  </FormDescription>
                                  <Select
                                    value={String(field.value)}
                                    onValueChange={(value) =>
                                      field.onChange(Number(value))
                                    }
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Choose a reflection depth" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {SPIRITUAL_GIFT_DEPTH_OPTIONS.map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={String(option.value)}
                                        >
                                          {option.label} · {option.summary}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm">
                                    <p className="font-medium">
                                      {selectedDepth.label}: {selectedDepth.summary}
                                    </p>
                                    <p className="mt-1 text-muted-foreground">
                                      {selectedDepth.description}
                                    </p>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                          <FormField
                            control={form.control}
                            name="enabledSpiritualGifts"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-baseline justify-between gap-4">
                                  <FormLabel>Included spiritual gifts</FormLabel>
                                  <span className="text-sm text-muted-foreground">{field.value.length} enabled</span>
                                </div>
                                <FormDescription>
                                  Select at least 3 gifts. Members will answer the
                                  reflection depth selected above for every enabled gift.
                                  Your church controls the final list.
                                </FormDescription>
                                {customizationMode === "tradition" &&
                                  excludedSpiritualGifts(churchTradition).length >
                                    0 && (
                                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
                                      <p className="font-medium">
                                        Tradition-based starting point
                                      </p>
                                      <p className="mt-1 text-primary/80">
                                        For{" "}
                                        {
                                          CHURCH_TRADITIONS.find(
                                            (item) =>
                                              item.value === churchTradition,
                                          )?.label
                                        }
                                        , the suggested list leaves out{" "}
                                        {excludedSpiritualGifts(
                                          churchTradition,
                                        ).join(" and ")}
                                        . You can add them back if they fit
                                        your church.
                                      </p>
                                    </div>
                                  )}
                                 <Collapsible
                                   open={spiritualGiftsExpanded}
                                   onOpenChange={setSpiritualGiftsExpanded}
                                   className="space-y-3"
                                 >
                                   <CollapsibleTrigger asChild>
                                     <Button
                                       type="button"
                                       variant="outline"
                                       className="w-full justify-between"
                                     >
                                       {spiritualGiftsExpanded
                                         ? "Hide gift choices"
                                         : "Edit included gifts"}
                                       <ChevronDown
                                         className={`h-4 w-4 transition-transform ${
                                           spiritualGiftsExpanded ? "rotate-180" : ""
                                         }`}
                                         aria-hidden="true"
                                       />
                                     </Button>
                                   </CollapsibleTrigger>
                                   <CollapsibleContent className="space-y-3">
                                     <div className="grid gap-2 sm:grid-cols-2">
                                       {SPIRITUAL_GIFTS.map(([name, meaning]) => {
                                         const checked = field.value.includes(name);
                                         return (
                                           <label key={name} className="flex cursor-pointer gap-3 rounded-lg border p-3 text-sm hover:bg-muted/40">
                                             <Checkbox
                                               checked={checked}
                                               onCheckedChange={(next) => field.onChange(next ? [...field.value, name] : field.value.filter((gift) => gift !== name))}
                                             />
                                             <span><span className="block font-medium">{name}</span><span className="text-muted-foreground">{meaning}</span></span>
                                           </label>
                                         );
                                       })}
                                     </div>
                                   </CollapsibleContent>
                                 </Collapsible>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          </div>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}

              <div className="rounded-lg border border-border/50 bg-card p-4 space-y-5">
                <div>
                  <h4 className="font-medium">Passions and ministry interests</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Members will see the generic options below plus any options you add for your church.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="assessmentConfiguration.passions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passions</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {field.value.map(option => (
                          <span key={option} className="inline-flex items-center gap-1 rounded-full border bg-muted/30 px-3 py-1 text-sm">
                            {option}
                            {!GENERIC_PASSIONS.includes(option as never) && (
                              <button type="button" className="ml-1 text-muted-foreground hover:text-foreground" onClick={() => removeCustomOption("passions", option)} aria-label={`Remove ${option}`}>
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input value={passionDraft} onChange={event => setPassionDraft(event.target.value)} placeholder="Add a church-specific passion" maxLength={80} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addCustomOption("passions", passionDraft, () => setPassionDraft("")); } }} />
                        <Button type="button" variant="outline" onClick={() => addCustomOption("passions", passionDraft, () => setPassionDraft(""))}>Add</Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assessmentConfiguration.ministryInterests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ministry interests</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {field.value.map(option => (
                          <span key={option} className="inline-flex items-center gap-1 rounded-full border bg-muted/30 px-3 py-1 text-sm">
                            {option}
                            {!GENERIC_MINISTRY_INTERESTS.includes(option as never) && (
                              <button type="button" className="ml-1 text-muted-foreground hover:text-foreground" onClick={() => removeCustomOption("ministryInterests", option)} aria-label={`Remove ${option}`}>
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input value={interestDraft} onChange={event => setInterestDraft(event.target.value)} placeholder="Add a church-specific ministry interest" maxLength={80} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addCustomOption("ministryInterests", interestDraft, () => setInterestDraft("")); } }} />
                        <Button type="button" variant="outline" onClick={() => addCustomOption("ministryInterests", interestDraft, () => setInterestDraft(""))}>Add</Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

      </div>

      <div className={setupTab === "church" ? "space-y-8" : "hidden"}>

          <Card className="church-setup-section-card border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-xl">
                <Palette className="h-5 w-5 text-primary" />
                Church Branding
              </CardTitle>
              <CardDescription>
                Add your logo and choose the colors members will see throughout the public assessment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-[160px_1fr] sm:items-center">
                <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 p-4">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Church logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ImagePlus className="mx-auto mb-2 h-8 w-8" />
                      <span className="text-xs">No logo yet</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Church logo</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      PNG, JPG, or WebP. Maximum 5 MB. A wide or square logo works best.
                    </p>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(event) => void handleLogoUpload(event.target.files?.[0])}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isLogoUploading}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {isLogoUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      {logoUrl ? "Replace Logo" : "Upload Logo"}
                    </Button>
                    {logoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          {
                            if (localLogoPreview) URL.revokeObjectURL(localLogoPreview);
                            setLocalLogoPreview(null);
                            setLogoPath(null);
                          }
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {([
                  ["primaryColor", "Primary color", "Buttons, progress, and key highlights"],
                  ["accentColor", "Accent color", "Secondary highlights and details"],
                ] as const).map(([name, label, description]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormDescription>{description}</FormDescription>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            aria-label={`${label} picker`}
                            className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
                            value={field.value}
                            onChange={field.onChange}
                          />
                          <FormControl>
                            <Input
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                              maxLength={7}
                              className="font-mono uppercase"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div
                className="overflow-hidden rounded-xl border"
                style={{ borderColor: `${primaryColor}33` }}
              >
                <div
                  className="flex items-center gap-3 px-5 py-4"
                  style={{
                    backgroundColor: primaryColor,
                    color: contrastTextColor(primaryColor),
                  }}
                >
                  {logoPreview && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1.5">
                      <img
                        src={logoPreview}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-serif text-lg font-medium">{form.watch("name") || "Your Church"}</p>
                    <p className="text-xs opacity-75">Ministry Profile preview</p>
                  </div>
                  <span
                    className="ml-auto h-3 w-3 rounded-full ring-4 ring-current/20"
                    style={{ backgroundColor: accentColor }}
                    aria-label="Accent color preview"
                  />
                </div>
                <div className="bg-background p-5">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: accentColor }} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    This preview shows how your logo and colors will work together.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={saveBranding}
                  disabled={updateBranding.isPending || isLogoUploading}
                >
                  {updateBranding.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving branding...
                    </>
                  ) : (
                    "Save Logo & Colors"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-serif">Basic Information</CardTitle>
              <CardDescription>
                This information is displayed on your public assessment landing page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Church Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Grace City Church" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="adminName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Administrator Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormDescription>Where assessment notifications are sent.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
      </div>
            </div>
          </Tabs>
          <div className="church-setup-savebar rounded-xl border px-6 py-4">
            <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
              Changes apply to new member assessments. Completed profiles keep the settings and answers they were created with.
            </p>
            <Button type="submit" disabled={updateChurch.isPending || isLogoUploading} className="w-full min-w-[120px] sm:ml-auto sm:w-auto">
              {updateChurch.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
