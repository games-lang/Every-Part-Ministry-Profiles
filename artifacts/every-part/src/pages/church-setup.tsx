import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  getGetMyChurchQueryKey,
  requestUploadUrl,
  useGetMyChurch,
  useUpdateMyChurch,
  type SpiritualGiftName,
  type UploadUrlRequestContentType,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, ExternalLink, ImagePlus, Loader2, Palette, Trash2, Upload } from "lucide-react";

const churchFormSchema = z.object({
  name: z.string().min(1, "Church name is required"),
  adminName: z.string().min(1, "Admin name is required"),
  adminEmail: z.string().email("Valid email is required"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  address: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a 6-digit hex color"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a 6-digit hex color"),
  enabledSpiritualGifts: z.array(z.string()).min(3, "Enable at least three spiritual gifts"),
});

type ChurchFormValues = z.infer<typeof churchFormSchema>;
const SPIRITUAL_GIFTS = [
  ["Administration", "organizing people, resources, and systems effectively"], ["Apostleship", "pioneering, starting, expanding, and establishing new ministries or works"], ["Discernment of Spirits", "recognizing what is from God, human influence, or spiritual deception"], ["Evangelism", "communicating the gospel and helping people respond to Jesus"], ["Exhortation / Encouragement", "strengthening, motivating, comforting, and challenging others"], ["Faith", "unusual confidence in God’s power, promises, and provision"], ["Giving", "generously and joyfully sharing resources to advance God’s work and meet needs"], ["Healing", "being used by God as an instrument of physical, emotional, or spiritual healing"], ["Helps / Service", "meeting practical needs and supporting others so ministry can happen"], ["Hospitality", "welcoming people and creating environments where others feel received and cared for"], ["Interpretation of Tongues", "interpreting a message spoken in tongues"], ["Knowledge", "understanding and communicating spiritual truth or insight"], ["Leadership", "providing direction, motivating others, and helping a group move toward God-given goals"], ["Mercy", "compassionately caring for people who are hurting, struggling, marginalized, or in need"], ["Miracles", "being used by God in extraordinary demonstrations of His power"], ["Pastoring / Shepherding", "caring for, protecting, guiding, and nurturing people spiritually"], ["Prophecy", "communicating a message believed to be prompted by God for strengthening, correction, encouragement, or direction"], ["Teaching", "explaining and applying biblical truth so others understand and grow"], ["Tongues", "speaking in a language or spiritual utterance given through the Holy Spirit"], ["Wisdom", "applying spiritual truth appropriately to real situations"], ["Craftsmanship", "using artistic or practical skill for God’s purposes"], ["Intercession", "persistent, focused prayer for others"], ["Missionary / Cross-Cultural Ministry", "effectively ministering across cultures and communities"], ["Music / Worship", "using musical ability to lead and encourage worship"], ["Celibacy", "a particular grace for remaining unmarried for undivided devotion to ministry"], ["Voluntary Poverty", "willingly living with less in order to serve God and others"],
] as const;
const ALL_GIFT_NAMES = SPIRITUAL_GIFTS.map(([name]) => name);
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_LOGO_SIZE = 5 * 1024 * 1024;

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
  const updateChurch = useUpdateMyChurch();
  const queryClient = useQueryClient();
  const initializedForId = useRef<number | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [localLogoPreview, setLocalLogoPreview] = useState<string | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);

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
    },
  });

  useEffect(() => {
    if (church && initializedForId.current !== church.id) {
      initializedForId.current = church.id;
      form.reset({
        name: church.name,
        adminName: church.adminName,
        adminEmail: church.adminEmail,
        website: church.website || "",
        address: church.address || "",
        primaryColor: church.primaryColor,
        accentColor: church.accentColor,
        enabledSpiritualGifts: church.enabledSpiritualGifts || ALL_GIFT_NAMES,
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
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-serif">Build or edit your Ministry Profile</CardTitle>
              <CardDescription>
                Choose which spiritual gifts to include in your church's public Ministry Profile assessment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="enabledSpiritualGifts"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-baseline justify-between gap-4">
                      <FormLabel>Spiritual gifts included in the public assessment</FormLabel>
                      <span className="text-sm text-muted-foreground">{field.value.length} enabled</span>
                    </div>
                    <FormDescription>
                      Select at least 3 gifts. Members will answer all three reflections for each enabled gift; gift wording cannot be edited here.
                    </FormDescription>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {SPIRITUAL_GIFTS.map(([name, meaning]) => {
                        const checked = field.value.includes(name);
                        return <label key={name} className="flex cursor-pointer gap-3 rounded-lg border p-3 text-sm hover:bg-muted/40">
                          <Checkbox checked={checked} onCheckedChange={(next) => field.onChange(next ? [...field.value, name] : field.value.filter((gift) => gift !== name))} />
                          <span><span className="block font-medium">{name}</span><span className="text-muted-foreground">{meaning}</span></span>
                        </label>;
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
