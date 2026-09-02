import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const allowedOrigins = new Set([
  "https://every-part-ministry-profiles.replit.app",
  "https://7258c080-b22e-4271-bfc4-1f2b1af43cde-00-2so2vv36g78g.janeway.replit.dev",
]);

function corsOrigin(origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) {
  if (!origin) return cb(null, false);
  try {
    cb(null, allowedOrigins.has(origin));
  } catch {
    cb(null, false);
  }
}

const app: Express = express();
  app.use((req, res, next) => {
      const path = req.path || "";
      if (
            path === "/sign-in" || path.startsWith("/sign-in/") ||
            path.startsWith("/profile") ||
            path === "/discover" || path.startsWith("/discover/")
          ) {
            res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
            res.setHeader("X-Frame-Options", "DENY");
      }
      next();
  });

  
          

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(cors({ credentials: true, origin: corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

export default app;
