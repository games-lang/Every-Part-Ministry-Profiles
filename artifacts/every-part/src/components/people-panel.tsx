import { useState } from "react";
import {
  getListPeopleQueryKey,
  type MinistryPerson,
  type MinistryPersonInput,
  useCreatePerson,
  useCreatePersonInvite,
  useGetMyChurch,
  useImportPeople,
  useListPeople,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  Clipboard,
  Download,
  FileSpreadsheet,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { buildInviteUrl } from "@/lib/invite-url";

type PersonForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const emptyForm: PersonForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

function fieldValue(value: string) {
  return value.trim() || null;
}

type ImportPreviewRow = {
  row: number;
  person: MinistryPersonInput;
  error?: string;
};

type ImportSummary = {
  created: MinistryPerson[];
  skipped: Array<{ row: number; reason: string }>;
};

const csvHeaderAliases: Record<string, keyof PersonForm> = {
  firstname: "firstName",
  givenname: "firstName",
  first: "firstName",
  lastname: "lastName",
  surname: "lastName",
  familyname: "lastName",
  last: "lastName",
  email: "email",
  phonenumber: "phone",
  phone: "phone",
  mobile: "phone",
  address: "addressLine1",
  address1: "addressLine1",
  street: "addressLine1",
  addressline1: "addressLine1",
  address2: "addressLine2",
  addressline2: "addressLine2",
  city: "city",
  state: "state",
  province: "state",
  postalcode: "postalCode",
  zipcode: "postalCode",
  zip: "postalCode",
  country: "country",
};

function normalizeCsvHeader(header: string) {
  return header.trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCsvRecords(csv: string) {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const next = csv[index + 1];
    if (character === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      record.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      record.push(cell);
      if (record.some((value) => value.trim())) records.push(record);
      record = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell || record.length) {
    record.push(cell);
    if (record.some((value) => value.trim())) records.push(record);
  }
  return records;
}

function parsePeopleCsv(csv: string) {
  const records = parseCsvRecords(csv);
  if (records.length < 2) {
    return { rows: [], errors: ["Add a header row and at least one person."] };
  }

  const headerIndexes = new Map<keyof PersonForm, number>();
  records[0].forEach((header, index) => {
    const field = csvHeaderAliases[normalizeCsvHeader(header)];
    if (field && !headerIndexes.has(field)) headerIndexes.set(field, index);
  });
  const errors: string[] = [];
  if (!headerIndexes.has("firstName") || !headerIndexes.has("lastName")) {
    errors.push("Your CSV must include first name and last name columns.");
  }
  if (records.length - 1 > 500) {
    errors.push("Choose a CSV with 500 or fewer people.");
  }

  const rows: ImportPreviewRow[] = records.slice(1, 501).map((values, index) => {
    const value = (field: keyof PersonForm) =>
      headerIndexes.has(field) ? values[headerIndexes.get(field)!]?.trim() ?? "" : "";
    const email = value("email");
    const person: MinistryPersonInput = {
      firstName: value("firstName"),
      lastName: value("lastName"),
      email: fieldValue(email),
      phone: fieldValue(value("phone")),
      addressLine1: fieldValue(value("addressLine1")),
      addressLine2: fieldValue(value("addressLine2")),
      city: fieldValue(value("city")),
      state: fieldValue(value("state")),
      postalCode: fieldValue(value("postalCode")),
      country: fieldValue(value("country")),
    };
    let error: string | undefined;
    if (!person.firstName || !person.lastName) {
      error = "First name and last name are required.";
    } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      error = "Enter a valid email address or leave it blank.";
    }
    return { row: index + 2, person, error };
  });

  return { rows, errors };
}

function csvTemplateUrl() {
  const csv = [
    "first name,last name,email,phone,address line 1,address line 2,city,state,postal code,country",
    "Jordan,Lee,jordan@example.com,555-0100,123 Main Street,,Springfield,IL,62701,United States",
  ].join("\n");
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

function personAddress(person: MinistryPerson) {
  return [
    person.addressLine1,
    person.addressLine2,
    [person.city, person.state, person.postalCode].filter(Boolean).join(", "),
    person.country,
  ]
    .filter(Boolean)
    .join(" · ");
}

function CsvImportDialog({
  open,
  onOpenChange,
  onImport,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (people: MinistryPersonInput[]) => void;
  isPending: boolean;
}) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportPreviewRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const chooseFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = parsePeopleCsv(await file.text());
      setFileName(file.name);
      setRows(parsed.rows);
      setErrors(parsed.errors);
    } catch {
      setFileName(file.name);
      setRows([]);
      setErrors(["This file could not be read as CSV."]);
    }
  };
  const validRows = rows.filter((row) => !row.error).map((row) => row.person);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import people from CSV</DialogTitle>
          <DialogDescription>
            Upload a spreadsheet with first name and last name columns. Each
            created person receives a private Ministry Profile invitation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Label htmlFor="people-csv">CSV file</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supports quoted commas and line breaks, plus common header names.
                </p>
              </div>
              <a
                href={csvTemplateUrl()}
                download="every-part-people-template.csv"
                className="inline-flex items-center text-sm font-medium text-primary hover:underline"
              >
                <Download className="mr-1.5 h-4 w-4" />
                Download template
              </a>
            </div>
            <Input
              id="people-csv"
              className="mt-3"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => void chooseFile(event.target.files?.[0])}
            />
            {fileName && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {fileName}
              </p>
            )}
          </div>

          {errors.length > 0 && (
            <div className="space-y-1 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {errors.map((error) => <p key={error}>{error}</p>)}
            </div>
          )}

          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 text-sm">
                <Badge variant="outline">{`${validRows.length} ready to import`}</Badge>
                <Badge variant="outline">{`${rows.length - validRows.length} rows need attention`}</Badge>
              </div>
              <div className="max-h-64 overflow-y-auto rounded-lg border">
                {rows.map((row) => (
                  <div key={row.row} className="flex gap-3 border-b px-3 py-2 text-sm last:border-b-0">
                    <span className="w-10 shrink-0 text-muted-foreground">{`Row ${row.row}`}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {`${row.person.firstName || "—"} ${row.person.lastName}`}
                      {row.person.email ? ` · ${row.person.email}` : ""}
                    </span>
                    {row.error && <span className="text-destructive">{row.error}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onImport(validRows)}
            disabled={isPending || validRows.length === 0 || errors.length > 0}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
            {validRows.length ? `Import ${validRows.length} people` : "Import people"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function inviteStatus(person: MinistryPerson) {
  if (person.profileId || person.inviteStatus === "completed") {
    return {
      label: "Profile complete",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    };
  }
  if (person.inviteStatus === "expired") {
    return {
      label: "Invite expired",
      className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    };
  }
  return {
    label: "Awaiting profile",
    className: "border-primary/20 bg-primary/5 text-primary",
  };
}

function PersonEditor({
  open,
  form,
  onOpenChange,
  onChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  form: PersonForm;
  onOpenChange: (open: boolean) => void;
  onChange: (field: keyof PersonForm, value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a person</DialogTitle>
          <DialogDescription>
            Save their contact details and create a private link they can use to
            complete their Ministry Profile.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="person-first-name">First name</Label>
            <Input
              id="person-first-name"
              value={form.firstName}
              onChange={(event) => onChange("firstName", event.target.value)}
              autoComplete="given-name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="person-last-name">Last name</Label>
            <Input
              id="person-last-name"
              value={form.lastName}
              onChange={(event) => onChange("lastName", event.target.value)}
              autoComplete="family-name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="person-email">Email</Label>
            <Input
              id="person-email"
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              autoComplete="email"
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="person-phone">Phone</Label>
            <Input
              id="person-phone"
              type="tel"
              value={form.phone}
              onChange={(event) => onChange("phone", event.target.value)}
              autoComplete="tel"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="person-address-line-1">Address</Label>
            <Input
              id="person-address-line-1"
              value={form.addressLine1}
              onChange={(event) => onChange("addressLine1", event.target.value)}
              autoComplete="street-address"
              placeholder="Street address"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="person-address-line-2">Address line 2</Label>
            <Input
              id="person-address-line-2"
              value={form.addressLine2}
              onChange={(event) => onChange("addressLine2", event.target.value)}
              autoComplete="address-line2"
              placeholder="Apartment, suite, or unit"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="person-city">City</Label>
            <Input
              id="person-city"
              value={form.city}
              onChange={(event) => onChange("city", event.target.value)}
              autoComplete="address-level2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="person-state">State / province</Label>
            <Input
              id="person-state"
              value={form.state}
              onChange={(event) => onChange("state", event.target.value)}
              autoComplete="address-level1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="person-postal-code">Postal code</Label>
            <Input
              id="person-postal-code"
              value={form.postalCode}
              onChange={(event) => onChange("postalCode", event.target.value)}
              autoComplete="postal-code"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="person-country">Country</Label>
            <Input
              id="person-country"
              value={form.country}
              onChange={(event) => onChange("country", event.target.value)}
              autoComplete="country-name"
              placeholder="United States"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Add person & create link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InviteActions({
  person,
  churchSlug,
  onRenew,
  isRenewing,
}: {
  person: MinistryPerson;
  churchSlug: string;
  onRenew: () => void;
  isRenewing: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = buildInviteUrl(churchSlug, person.inviteToken);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      toast({ title: "Invite link copied" });
    } catch {
      toast({
        title: "Could not copy the invite link",
        description: "Open the link and copy it from the address bar.",
        variant: "destructive",
      });
    }
  };
  const email = () => {
    if (!person.email) return;
    const subject = `Your ${person.firstName} Ministry Profile`;
    const body = `Hi ${person.firstName},\n\nPlease take a few minutes to complete your Ministry Profile:\n\n${inviteUrl}\n\nThank you!`;
    window.location.href = `mailto:${encodeURIComponent(person.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
        {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Clipboard className="mr-1.5 h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </Button>
      {person.email && (
        <Button type="button" size="sm" variant="outline" onClick={email}>
          <Send className="mr-1.5 h-3.5 w-3.5" />
          Email link
        </Button>
      )}
      <Button type="button" size="sm" variant="ghost" onClick={onRenew} disabled={isRenewing}>
        {isRenewing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
        Renew
      </Button>
    </div>
  );
}

export function PeoplePanel() {
  const queryClient = useQueryClient();
  const { data: church } = useGetMyChurch();
  const { data: people, isLoading, isError } = useListPeople();
  const createPerson = useCreatePerson();
  const createInvite = useCreatePersonInvite();
  const importPeople = useImportPeople();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState<PersonForm>(emptyForm);
  const [latestInvite, setLatestInvite] = useState<MinistryPerson | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
  };
  const updateForm = (field: keyof PersonForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  const submit = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast({
        title: "Add a first and last name",
        description: "Those details are needed to create the person record.",
        variant: "destructive",
      });
      return;
    }
    const data: MinistryPersonInput = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: fieldValue(form.email),
      phone: fieldValue(form.phone),
      addressLine1: fieldValue(form.addressLine1),
      addressLine2: fieldValue(form.addressLine2),
      city: fieldValue(form.city),
      state: fieldValue(form.state),
      postalCode: fieldValue(form.postalCode),
      country: fieldValue(form.country),
    };
    createPerson.mutate(
      { data },
      {
        onSuccess: async (person) => {
          await refresh();
          setLatestInvite(person);
          setForm(emptyForm);
          setOpen(false);
          toast({ title: "Person added", description: "Their private profile link is ready to share." });
        },
        onError: () =>
          toast({
            title: "Could not add this person",
            description: "Check the details and try again.",
            variant: "destructive",
          }),
      },
    );
  };
  const renew = (person: MinistryPerson) => {
    createInvite.mutate(
      { id: person.id },
      {
        onSuccess: async (renewed) => {
          await refresh();
          setLatestInvite(renewed);
          toast({ title: "Invite renewed", description: "The previous link is no longer active." });
        },
        onError: () =>
          toast({
            title: "Could not renew this invite",
            description: "Please try again.",
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PersonEditor
        open={open}
        form={form}
        onOpenChange={setOpen}
        onChange={updateForm}
        onSubmit={submit}
        isPending={createPerson.isPending}
      />
      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        isPending={importPeople.isPending}
        onImport={(importedPeople) => {
          importPeople.mutate(
            { data: { people: importedPeople } },
            {
              onSuccess: async (result) => {
                await refresh();
                setImportSummary(result);
                setImportOpen(false);
                toast({
                  title: "People imported",
                  description: `${result.created.length} created, ${result.skipped.length} skipped.`,
                });
              },
              onError: () =>
                toast({
                  title: "Could not import this CSV",
                  description: "Check the file format and try again.",
                  variant: "destructive",
                }),
            },
          );
        }}
      />
      <Card className="border-primary/15 bg-primary/[0.03] shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-medium">Invite someone to reflect</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Add a person once, keep their contact details with your church, and give them a private link to complete their Ministry Profile.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setImportOpen(true)} variant="outline" className="shrink-0">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={() => setOpen(true)} className="shrink-0">
              <UserPlus className="mr-2 h-4 w-4" />
              Add person
            </Button>
          </div>
        </CardContent>
      </Card>

      {importSummary && (
        <Card className="border-border/70 bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Latest import</CardTitle>
            <CardDescription>
              {`${importSummary.created.length} ${importSummary.created.length === 1 ? "person" : "people"} created and ${importSummary.skipped.length} ${importSummary.skipped.length === 1 ? "row" : "rows"} skipped.`}
            </CardDescription>
          </CardHeader>
          {importSummary.skipped.length > 0 && (
            <CardContent className="pt-0">
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border bg-background p-3 text-sm">
                {importSummary.skipped.map((item) => (
                  <p key={`${item.row}-${item.reason}`}>
                    <span className="font-medium">Row {item.row}:</span>{" "}
                    <span className="text-muted-foreground">{item.reason}</span>
                  </p>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {latestInvite && church?.slug && (
        <Card className="border-secondary/30 bg-secondary/10">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {`Link ready for ${latestInvite.firstName} ${latestInvite.lastName}`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Share it directly or open a pre-addressed email. This link expires in 30 days.
              </p>
            </div>
            <InviteActions
              person={latestInvite}
              churchSlug={church.slug}
              onRenew={() => renew(latestInvite)}
              isRenewing={createInvite.isPending}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex items-end justify-between gap-4 border-b border-border/50 pb-3">
        <div>
          <h2 className="font-serif text-2xl font-medium">Add people</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {`${people?.length ?? 0} ${people?.length === 1 ? "person" : "people"} added by your church`}
          </p>
        </div>
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          People could not be loaded right now. Please try again.
        </div>
      ) : isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="p-6">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="mt-3 h-4 w-72" />
              <Skeleton className="mt-5 h-9 w-56" />
            </Card>
          ))}
        </div>
      ) : people && people.length > 0 ? (
        <div className="grid gap-4">
          {people.map((person) => {
            const status = inviteStatus(person);
            const address = personAddress(person);
            return (
              <Card key={person.id} className="border-border/70 shadow-sm">
                <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between md:p-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-serif text-xl font-medium">
                        {`${person.firstName} ${person.lastName}`}
                      </h3>
                      <Badge variant="outline" className={status.className}>
                        {person.profileId || person.inviteStatus === "completed" ? (
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        ) : null}
                        {status.label}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                      {person.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          {person.email}
                        </span>
                      )}
                      {person.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {person.phone}
                        </span>
                      )}
                      {address && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {address}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {person.inviteStatus === "completed"
                        ? "Their completed profile is in the People directory."
                        : `Invite expires ${new Date(person.inviteExpiresAt).toLocaleDateString()}.`}
                    </p>
                  </div>
                  {church?.slug && (
                    <InviteActions
                      person={person}
                      churchSlug={church.slug}
                      onRenew={() => renew(person)}
                      isRenewing={createInvite.isPending && createInvite.variables?.id === person.id}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed border-border/80">
          <CardHeader className="items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-primary">
              <UserPlus className="h-6 w-6" />
            </div>
            <CardTitle className="font-serif text-xl">No people added yet</CardTitle>
            <CardDescription>
              Add someone from your church and Every Part will create a private link for their profile.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}