import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { helmetConfig, corsConfig, sanitizeInput } from "./middleware/security";
import logger from "./logger";

const isDev = process.env.NODE_ENV !== "production";

process.on("uncaughtException", (err) => {
  logger.fatal({ err, event: "uncaughtException" }, err.message);
  if (!isDev) process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  if (reason instanceof Error) {
    logger.fatal({ err: reason, event: "unhandledRejection" }, reason.message);
  } else {
    logger.fatal({ reason, event: "unhandledRejection" }, String(reason));
  }
  if (!isDev) process.exit(1);
});

const app = express();

// Security middleware
app.use(helmetConfig);
app.use(corsConfig);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Input sanitization
app.use(sanitizeInput);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error({ err, status }, message);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logger.info({ port }, `serving on port ${port}`);
  });
})().catch((err) => {
  const message = err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
  log(`[fatal] Server failed to start: ${message}`);
  process.exit(1);
});
