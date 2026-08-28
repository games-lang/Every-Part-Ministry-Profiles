import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetMyChurch, useUpdateMyChurch, getGetMyChurchQueryKey, type SpiritualGiftName } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, ExternalLink, Loader2 } from "lucide-react";

const churchFormSchema = z.object({
  name: z.string().min(1, "Church name is required"),
  adminName: z.string().min(1, "Admin name is required"),
  adminEmail: z.string().email("Valid email is required"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  address: z.string().optional(),
  enabledSpiritualGifts: z.array(z.string()).min(3, "Enable at least three spiritual gifts"),
});

type ChurchFormValues = z.infer<typeof churchFormSchema>;
const SPIRITUAL_GIFTS = [
  ["Administration", "organizing people, resources, and systems effectively"], ["Apostleship", "pioneering, starting, expanding, and establishing new ministries or works"], ["Discernment of Spirits", "recognizing what is from God, human influence, or spiritual deception"], ["Evangelism", "communicating the gospel and helping people respond to Jesus"], ["Exhortation / Encouragement", "strengthening, motivating, comforting, and challenging others"], ["Faith", "unusual confidence in God’s power, promises, and provision"], ["Giving", "generously and joyfully sharing resources to advance God’s work and meet needs"], ["Healing", "being used by God as an instrument of physical, emotional, or spiritual healing"], ["Helps / Service", "meeting practical needs and supporting others so ministry can happen"], ["Hospitality", "welcoming people and creating environments where others feel received and cared for"], ["Interpretation of Tongues", "interpreting a message spoken in tongues"], ["Knowledge", "understanding and communicating spiritual truth or insight"], ["Leadership", "providing direction, motivating others, and helping a group move toward God-given goals"], ["Mercy", "compassionately caring for people who are hurting, struggling, marginalized, or in need"], ["Miracles", "being used by God in extraordinary demonstrations of His power"], ["Pastoring / Shepherding", "caring for, protecting, guiding, and nurturing people spiritually"], ["Prophecy", "communicating a message believed to be prompted by God for strengthening, correction, encouragement, or direction"], ["Teaching", "explaining and applying biblical truth so others understand and grow"], ["Tongues", "speaking in a language or spiritual utterance given through the Holy Spirit"], ["Wisdom", "applying spiritual truth appropriately to real situations"], ["Craftsmanship", "using artistic or practical skill for God’s purposes"], ["Intercession", "persistent, focused prayer for others"], ["Missionary / Cross-Cultural Ministry", "effectively ministering across cultures and communities"], ["Music / Worship", "using musical ability to lead and encourage worship"], ["Celibacy", "a particular grace for remaining unmarried for undivided devotion to ministry"], ["Voluntary Poverty", "willingly living with less in order to serve God and others"],
] as const;
const ALL_GIFT_NAMES = SPIRITUAL_GIFTS.map(([name]) => name);

export default function ChurchSetup() {
  const { data: church, isLoading } = useGetMyChurch();
  const updateChurch = useUpdateMyChurch();
  const queryClient = useQueryClient();
  const initializedForId = useRef<number | null>(null);

  const form = useForm<ChurchFormValues>({
    resolver: zodResolver(churchFormSchema),
    defaultValues: {
      name: "",
      adminName: "",
      adminEmail: "",
      website: "",
      address: "",
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
        enabledSpiritualGifts: church.enabledSpiritualGifts || ALL_GIFT_NAMES,
      });
    }
  }, [church, form]);

  const onSubmit = (data: ChurchFormValues) => {
    // Nullify empty strings
    const payload = {
      ...data,
      website: data.website || null,
      address: data.address || null,
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
              <Button type="submit" disabled={updateChurch.isPending} className="ml-auto min-w-[120px]">
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
