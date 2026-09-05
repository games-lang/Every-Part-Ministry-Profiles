import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
const maxSize = 5 * 1024 * 1024;

function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

export function ProfilePhotoUploader({
  churchSlug,
  name,
  value,
  onChange,
  onUploadingChange,
  disabled = false,
}: {
  churchSlug: string;
  name: string;
  value?: string | null;
  onChange: (path: string | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);
  const setBusy = (busy: boolean) => {
    setUploading(busy);
    onUploadingChange?.(busy);
  };
  const replace = async (file?: File) => {
    if (!file || uploading) return;
    setError("");
    if (!allowedTypes.includes(file.type) || file.size < 1 || file.size > maxSize) {
      setError("Choose a PNG, JPG, or WebP image under 5 MB.");
      return;
    }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = URL.createObjectURL(file);
    setPreview(previewRef.current);
    setProgress(0);
    setBusy(true);
    try {
      const requested = await fetch("/api/storage/profile-photos/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ churchSlug, name: file.name, size: file.size, contentType: file.type }),
      });
      const upload = await requested.json() as { uploadURL?: string; objectPath?: string; error?: string };
      if (!requested.ok || !upload.uploadURL || !upload.objectPath) throw new Error(upload.error || "Unable to prepare the photo upload.");
      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("PUT", upload.uploadURL!);
        request.setRequestHeader("Content-Type", file.type);
        request.upload.onprogress = (event) => event.lengthComputable && setProgress(Math.round(event.loaded / event.total * 100));
        request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error("Photo upload failed. Please try again."));
        request.onerror = () => reject(new Error("Photo upload failed. Please try again."));
        request.send(file);
      });
      onChange(upload.objectPath);
      setProgress(100);
    } catch (reason) {
      setPreview(null);
      onChange(null);
      setError(reason instanceof Error ? reason.message : "Photo upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const remove = () => {
    if (uploading) return;
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPreview(null);
    setError("");
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary">
      {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <span>{initials(name)}</span>}
    </div>
    <div className="min-w-0 flex-1">
      <p className="font-medium">Profile photo <span className="font-normal text-muted-foreground">(optional)</span></p>
      <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, or WebP, up to 5 MB.</p>
      {uploading && <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading {progress}%</div>}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
    <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => void replace(event.target.files?.[0])} />
    <div className="flex shrink-0 gap-2">
      <Button type="button" variant="outline" size="sm" disabled={disabled || uploading} onClick={() => inputRef.current?.click()}>
        <Camera className="mr-1.5 h-4 w-4" />{value || preview ? "Replace" : "Add"}
      </Button>
      {(value || preview) && <Button type="button" variant="ghost" size="icon" aria-label="Remove profile photo" disabled={disabled || uploading} onClick={remove}><Trash2 className="h-4 w-4" /></Button>}
    </div>
  </div>;
}

export function ProfileAvatar({ name, photoUrl, className = "h-12 w-12" }: { name: string; photoUrl?: string | null; className?: string }) {
  return <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary ${className}`}>
    {photoUrl ? <img src={photoUrl} alt="" className="h-full w-full object-cover" /> : <span>{initials(name)}</span>}
  </div>;
}