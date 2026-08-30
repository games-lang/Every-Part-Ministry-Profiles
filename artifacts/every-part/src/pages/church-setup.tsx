import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  getGetMyChurchQueryKey,
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
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, ExternalLink, ImagePlus, Loader2, Palette, Trash2, Upload, UserPlus, UsersRound } from "lucide-react";

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
    passions: z.array(z.string().min(1).max(80)).max(100),
    ministryInterests: z.array(z.string().min(1).max(80)).max(100),
  })
});

type ChurchFormValues = z.infer<typeof churchFormSchema>;
const SPIRITUAL_GIFTS = [
  ["Administration", "organizing people, resources, and systems effectively"], ["Apostleship", "pioneering, starting, expanding, and establishing new ministries or works"], ["Discernment of Spirits", "recognizing what is from God, human influence, or spiritual deception"], ["Evangelism", "communicating the gospel and helping people respond to Jesus"], ["Exhortation / Encouragement", "strengthening, motivating, comforting, and challenging others"], ["Faith", "unusual confidence in God’s power, promises, and provision"], ["Giving", "generously and joyfully sharing resources to advance God’s work and meet needs"], ["Healing", "being used by God as an instrument of physical, emotional, or spiritual healing"], ["Helps / Service", "meeting practical needs and supporting others so ministry can happen"], ["Hospitality", "welcoming people and creating environments where others feel received and cared for"], ["Interpretation of Tongues", "interpreting a message spoken in tongues"], ["Knowledge", "understanding and communicating spiritual truth or insight"], ["Leadership", "providing direction, motivating others, and helping a group move toward God-given goals"], ["Mercy", "compassionately caring for people who are hurting, struggling, marginalized, or in need"], ["Miracles", "being used by God in extraordinary demonstrations of His power"], ["Pastoring / Shepherding", "caring for, protecting, guiding, and nurturing people spiritually"], ["Prophecy", "communicating a message believed to be prompted by God for strengthening, correction, encouragement, or direction"], ["Teaching", "explaining and applying biblical truth so others understand and grow"], ["Tongues", "speaking in a language or spiritual utterance given through the Holy Spirit"], ["Wisdom", "applying spiritual truth appropriately to real situations"], ["Craftsmanship", "using artistic or practical skill for God’s purposes"], ["Intercession", "persistent, focused prayer for others"], ["Missionary / Cross-Cultural Ministry", "effectively ministering across cultures and communities"], ["Music / Worship", "using musical ability to lead and encourage worship"], ["Celibacy", "a particular grace for remaining unmarried for undivided devotion to ministry"], ["Voluntary Poverty", "willingly living with less in order to serve God and others"],
] as const;
const ALL_GIFT_NAMES = SPIRITUAL_GIFTS.map(([name]) => name);
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_LOGO_SIZE = 5 * 1024 * 1024;

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
    description?: string;
  }>;
}

const CONFIG_SECTIONS: ConfigDef[] = [
  {
    key: "aboutYou",
    label: "Background & Experience",
    description: "Gather member history, skills, and defining life moments.",
    subsections: [
      { key: "aboutYou.personalInformation", label: "Demographics & Preferences", description: "Age range, contact preferences, family situation, languages." },
      { key: "aboutYou.skillsExperience", label: "Skills & Experience", description: "Occupational background and past ministry involvement." },
      { key: "aboutYou.lifeExperiences", label: "Life Experiences", description: "Significant events that shape their perspective." }
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
    label: "Fivefold / APEST",
    description: "Discover Apostolic, Prophetic, Evangelistic, Shepherding, and Teaching expressions.",
    subsections: [
      { key: "apest.builder", label: "Apostolic / Builder" },
      { key: "apest.insight", label: "Prophetic / Insight" },
      { key: "apest.connector", label: "Evangelistic / Connector" },
      { key: "apest.caregiver", label: "Shepherding / Caregiver" },
      { key: "apest.teacher", label: "Teaching / Educator" }
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

export default function ChurchSetup() {
  const { data: church, isLoading } = useGetMyChurch();
  const { data: admins, isLoading: adminsLoading } = useListChurchAdmins();
  const updateChurch = useUpdateMyChurch();
  const addAdmin = useAddChurchAdmin();
  const removeAdmin = useRemoveChurchAdmin();
  const queryClient = useQueryClient();
  const initializedForId = useRef<number | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [localLogoPreview, setLocalLogoPreview] = useState<string | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [adminEmailDraft, setAdminEmailDraft] = useState("");

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
        passions: [...GENERIC_PASSIONS],
        ministryInterests: [...GENERIC_MINISTRY_INTERESTS],
      },
    },
  });

  useEffect(() => {
    if (church && initializedForId.current !== church.id) {
      initializedForId.current = church.id;

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
          passions: church.assessmentConfiguration?.passions || [...GENERIC_PASSIONS],
          ministryInterests: church.assessmentConfiguration?.ministryInterests || [...GENERIC_MINISTRY_INTERESTS],
        },
      });
      setLogoPath(church.logoUrl || null);
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

  const copyToClipboard = () => {
    if (!church?.slug) return;
    const url = `${window.location.origin}/profile/${church.slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied to clipboard",
      description: "Assessment link copied!",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const logoUrl = logoPath;
  const primaryColor = form.watch("primaryColor");
  const accentColor = form.watch("accentColor");
  const logoPreview = localLogoPreview || savedLogoSource(logoUrl, church?.slug);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight">Church Setup</h1>
        <p className="text-muted-foreground mt-1">Manage your church details and profile link.</p>
      </div>

      <Card className="border-primary/20 bg-primary/5 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-primary">Your Assessment Link</CardTitle>
          <CardDescription className="text-primary/70">
            Share this link with your congregation to gather profiles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-background border border-primary/20 p-2 rounded-md">
            <div className="flex-1 truncate font-mono text-sm px-2 text-muted-foreground">
              {window.location.origin}/profile/{church?.slug}
            </div>
            <Button variant="secondary" size="sm" onClick={copyToClipboard} className="shrink-0">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <a href={`/profile/${church?.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-serif">Assessment Content</CardTitle>
              <CardDescription>
                Configure which sections and questions are included in your church's Ministry Profile assessment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  <div key={section.key} className={`rounded-lg border border-border/50 transition-colors ${isEnabled ? 'bg-card' : 'bg-muted/20 opacity-75'}`}>
                    <div className="flex items-start sm:items-center justify-between gap-4 p-4">
                      <div className="space-y-1">
                        <h4 className="font-medium">{section.label}</h4>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(val) => {
                          form.setValue(`assessmentConfiguration.sections.${section.key}`, val, { shouldDirty: true });
                          if (section.subsections) {
                            section.subsections.forEach(sub => {
                              form.setValue(`assessmentConfiguration.subsections.${sub.key}` as any, val, { shouldDirty: true });
                            });
                          }
                        }}
                      />
                    </div>

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
                                      <FormLabel className="font-normal leading-tight">
                                        {sub.label}
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

                    {isEnabled && section.key === "spiritualGifts" && (
                      <div className="p-4 pt-0">
                        <div className="pt-4 border-t space-y-4">
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
                                  Select at least 3 gifts. Members will answer all three reflections for each enabled gift; gift wording cannot be edited here.
                                </FormDescription>
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
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

          <Card className="border-border/60 shadow-sm">
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
            <CardFooter className="bg-muted/30 border-t border-border/50 px-6 py-4">
              <Button type="submit" disabled={updateChurch.isPending || isLogoUploading} className="ml-auto min-w-[120px]">
                {updateChurch.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
