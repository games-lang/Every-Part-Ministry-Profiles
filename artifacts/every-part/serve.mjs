import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import securityHeaders from "../../config/security-headers.json" with { type: "json" };

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".pdf": "application/pdf",
};

export function createWebServer(directory = path.join(import.meta.dirname, "dist/public")) {
  const root = path.resolve(directory);
  return createServer(async (req, res) => {
    for (const [name, value] of Object.entries(securityHeaders)) res.setHeader(name, value);
    const fail = (status, message) => {
      res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(req.method === "HEAD" ? undefined : message);
    };
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD");
      fail(405, "Method not allowed");
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      if (pathname.includes("\0")) throw new Error("Invalid path");
    } catch {
      fail(400, "Invalid path");
      return;
    }
    const isInside = (filename) => filename === root || filename.startsWith(`${root}${path.sep}`);
    let filename = path.resolve(root, `.${pathname}`);
    if (!isInside(filename)) {
      fail(403, "Forbidden");
      return;
    }
    try {
      const info = await stat(filename).catch((error) => {
        if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
        throw error;
      });
      if (!info?.isFile()) {
        // Preserve the existing SPA rewrite, but never turn missing scripts or
        // other static assets into HTML (especially with nosniff enabled).
        if (pathname.startsWith("/assets/") || types[path.extname(pathname)]) {
          fail(404, "Not found");
          return;
        }
        filename = path.join(root, "index.html");
      }
      if (!isInside(await realpath(filename))) {
        fail(403, "Forbidden");
        return;
      }
      const body = await readFile(filename);
      const extension = path.extname(filename).toLowerCase();
      res.writeHead(200, {
        "Content-Type": types[extension] ?? "application/octet-stream",
        "Content-Length": body.length,
        "Cache-Control": extension === ".html" ? "no-cache"
          : pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable"
            : "public, max-age=3600",
      });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch {
      fail(500, "Unable to serve this page");
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("A valid PORT is required");
  createWebServer().listen(port, "0.0.0.0", () => console.log(`Every Part web server listening on ${port}`));
}
