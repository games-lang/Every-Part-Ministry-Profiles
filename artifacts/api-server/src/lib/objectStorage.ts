import { randomUUID } from "crypto";
import { Readable } from "stream";
import { File, Storage } from "@google-cloud/storage";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

function parseObjectPath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const parts = normalized.split("/");
  if (parts.length < 3) throw new Error("Invalid object storage path");
  return {
    bucketName: parts[1],
    objectName: parts.slice(2).join("/"),
  };
}

async function signObjectURL({
  bucketName,
  objectName,
}: {
  bucketName: string;
  objectName: string;
}) {
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bucket_name: bucketName,
        object_name: objectName,
        method: "PUT",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to sign object URL: ${response.status}`);
  }
  const payload = (await response.json()) as { signed_url: string };
  return payload.signed_url;
}

export class ObjectStorageService {
  private getPrivateObjectDir() {
    const directory = process.env.PRIVATE_OBJECT_DIR;
    if (!directory) throw new Error("PRIVATE_OBJECT_DIR is not configured");
    return directory;
  }

  async getChurchLogoUploadURL(churchId: number) {
    const fullPath = `${this.getPrivateObjectDir()}/logos/${churchId}/${randomUUID()}`;
    return signObjectURL(parseObjectPath(fullPath));
  }

  async getProfilePhotoUploadURL(churchId: number) {
    const fullPath = `${this.getPrivateObjectDir()}/profile-photos/${churchId}/${randomUUID()}`;
    return signObjectURL(parseObjectPath(fullPath));
  }

  normalizeObjectEntityPath(rawPath: string) {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) return rawPath;
    const rawObjectPath = new URL(rawPath).pathname;
    const directory = `${this.getPrivateObjectDir().replace(/\/$/, "")}/`;
    if (!rawObjectPath.startsWith(directory)) return rawObjectPath;
    return `/objects/${rawObjectPath.slice(directory.length)}`;
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
    const entityId = objectPath.slice("/objects/".length);
    if (!entityId) throw new ObjectNotFoundError();
    const fullPath = `${this.getPrivateObjectDir().replace(/\/$/, "")}/${entityId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const [exists] = await file.exists();
    if (!exists) throw new ObjectNotFoundError();
    return file;
  }

  async validateChurchLogo(
    objectPath: string,
    churchId: number,
  ): Promise<{ file: File; contentType: string }> {
    const expectedPrefix = `/objects/logos/${churchId}/`;
    if (!objectPath.startsWith(expectedPrefix)) {
      throw new Error("Logo does not belong to this church");
    }
    const file = await this.getObjectEntityFile(objectPath);
    const [metadata] = await file.getMetadata();
    const size = Number(metadata.size || 0);
    const contentType = String(metadata.contentType || "");
    if (
      size < 1 ||
      size > 5 * 1024 * 1024 ||
      !["image/png", "image/jpeg", "image/webp"].includes(contentType)
    ) {
      await file.delete({ ignoreNotFound: true });
      throw new Error("Logo metadata is invalid");
    }

    const [header] = await file.download({ start: 0, end: 15 });
    const isPng =
      header.length >= 8 &&
      header.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      );
    const isJpeg =
      header.length >= 3 &&
      header[0] === 0xff &&
      header[1] === 0xd8 &&
      header[2] === 0xff;
    const isWebp =
      header.length >= 12 &&
      header.subarray(0, 4).toString("ascii") === "RIFF" &&
      header.subarray(8, 12).toString("ascii") === "WEBP";
    const signatureMatches =
      (contentType === "image/png" && isPng) ||
      (contentType === "image/jpeg" && isJpeg) ||
      (contentType === "image/webp" && isWebp);
    if (!signatureMatches) {
      await file.delete({ ignoreNotFound: true });
      throw new Error("Logo contents do not match the image type");
    }
    return { file, contentType };
  }

  async validateProfilePhoto(
    objectPath: string,
    churchId: number,
  ): Promise<{ file: File; contentType: string }> {
    const expectedPrefix = `/objects/profile-photos/${churchId}/`;
    if (!objectPath.startsWith(expectedPrefix)) {
      throw new Error("Profile photo does not belong to this church");
    }
    const file = await this.getObjectEntityFile(objectPath);
    const [metadata] = await file.getMetadata();
    const size = Number(metadata.size || 0);
    const contentType = String(metadata.contentType || "");
    if (
      size < 1 ||
      size > 5 * 1024 * 1024 ||
      !["image/png", "image/jpeg", "image/webp"].includes(contentType)
    ) {
      await file.delete({ ignoreNotFound: true });
      throw new Error("Profile photo metadata is invalid");
    }
    const [header] = await file.download({ start: 0, end: 15 });
    const isPng = header.length >= 8 && header.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    const isJpeg = header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    const isWebp = header.length >= 12 && header.subarray(0, 4).toString("ascii") === "RIFF" && header.subarray(8, 12).toString("ascii") === "WEBP";
    if (
      !((contentType === "image/png" && isPng) ||
        (contentType === "image/jpeg" && isJpeg) ||
        (contentType === "image/webp" && isWebp))
    ) {
      await file.delete({ ignoreNotFound: true });
      throw new Error("Profile photo contents do not match the image type");
    }
    return { file, contentType };
  }

  async deleteObject(objectPath: string) {
    const file = await this.getObjectEntityFile(objectPath);
    await file.delete({ ignoreNotFound: true });
  }

  async downloadObject(file: File, contentType: string) {
    const [metadata] = await file.getMetadata();
    const stream = Readable.toWeb(file.createReadStream()) as ReadableStream;
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    };
    if (metadata.size) headers["Content-Length"] = String(metadata.size);
    return new Response(stream, { headers });
  }
}